import unittest
from httpx import ASGITransport, AsyncClient

from apps.api.main import app
from apps.api.clinical_parser import parse_clinical_speech


class TestCorridaLeitoAPI(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.transport = ASGITransport(app=app)
        self.client = AsyncClient(transport=self.transport, base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()

    async def test_01_healthcheck(self):
        res = await self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")

    def test_02_clinical_speech_parser(self):
        speech = "Paciente estável, pressão 120 por 80, frequência cardíaca 76, saturando 98 em ar ambiente, afebril, glicemia 104, conduta manter antibiotico e pedir raio-x"
        parsed = parse_clinical_speech(speech)
        self.assertEqual(parsed["pa_sistolica"], 120)
        self.assertEqual(parsed["pa_diastolica"], 80)
        self.assertEqual(parsed["fc"], 76)
        self.assertEqual(parsed["sato2"], 98)
        self.assertEqual(parsed["temp"], 36.5)
        self.assertEqual(parsed["glicemia"], 104)
        self.assertIn("PA: 120x80 mmHg", parsed["detected_entities"])

    async def test_03_listar_leitos(self):
        res = await self.client.get("/api/leitos")
        self.assertEqual(res.status_code, 200)
        leitos = res.json()
        self.assertGreaterEqual(len(leitos), 1)

    async def test_04_export_summary(self):
        leitos_res = await self.client.get("/api/leitos")
        leitos = leitos_res.json()
        ocupados = [l for l in leitos if l.get("paciente")]
        self.assertTrue(len(ocupados) > 0)
        
        paciente_id = ocupados[0]["paciente"]["id"]
        res = await self.client.get(f"/api/export/paciente/{paciente_id}/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("paciente", data)
        self.assertIn("historico_corridas", data)

    async def test_05_simple_leito_lifecycle(self):
        # 1. Criar novo leito e paciente
        novo_res = await self.client.post("/api/simple/leitos", json={
            "leito": "Leito Teste 99",
            "paciente": "Paciente de Teste Unitário"
        })
        self.assertEqual(novo_res.status_code, 201)
        leito = novo_res.json()
        leito_id = leito["id"]
        self.assertEqual(leito["leito"], "Leito Teste 99")
        self.assertEqual(leito["status"], "ATIVO")

        # 2. Adicionar registro com autor
        reg_res = await self.client.post(f"/api/simple/leitos/{leito_id}/registros", json={
            "texto": "Sinais estáveis, afebril, eupneico. Dieta bem tolerada.",
            "tipo": "VOZ",
            "autor": "Dra. Camila Teste"
        })
        self.assertEqual(reg_res.status_code, 201)
        reg = reg_res.json()
        self.assertEqual(reg["autor"], "Dra. Camila Teste")
        self.assertEqual(reg["tipo"], "VOZ")

        # 3. Dar alta
        alta_res = await self.client.post(f"/api/simple/leitos/{leito_id}/alta")
        self.assertEqual(alta_res.status_code, 200)

        # 4. Listar com filtro ALTA
        list_altas = await self.client.get("/api/simple/leitos?status_filtro=ALTA")
        self.assertEqual(list_altas.status_code, 200)
        altas = list_altas.json()
        self.assertTrue(any(l["id"] == leito_id for l in altas))

        # 5. Reativar
        reativar_res = await self.client.post(f"/api/simple/leitos/{leito_id}/reativar")
        self.assertEqual(reativar_res.status_code, 200)

        # 6. Baixar prontuário TXT
        download_res = await self.client.get(f"/api/simple/leitos/{leito_id}/download")
        self.assertEqual(download_res.status_code, 200)
        self.assertIn("Dra. Camila Teste", download_res.text)

        # 7. Excluir leito
        del_res = await self.client.delete(f"/api/simple/leitos/{leito_id}")
        self.assertEqual(del_res.status_code, 200)

    async def test_06_frontend_static_serving(self):
        res = await self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("<!doctype html>", res.text.lower())
        self.assertIn("corrida de leito", res.text.lower())

    async def test_07_simple_leito_edit_and_criticidade(self):
        # 1. Criar leito
        novo = await self.client.post("/api/simple/leitos", json={
            "leito": "Leito UTI-05",
            "paciente": "Carlos Eduardo",
            "criticidade": "ESTAVEL"
        })
        self.assertEqual(novo.status_code, 201)
        data = novo.json()
        leito_id = data["id"]
        self.assertEqual(data["criticidade"], "ESTAVEL")

        # 2. Alterar criticidade para CRITICO
        crit_res = await self.client.patch(f"/api/simple/leitos/{leito_id}/criticidade", json={
            "criticidade": "CRITICO"
        })
        self.assertEqual(crit_res.status_code, 200)
        self.assertEqual(crit_res.json()["criticidade"], "CRITICO")

        # 3. Editar leito e paciente
        edit_res = await self.client.put(f"/api/simple/leitos/{leito_id}", json={
            "leito": "Leito UTI-05A",
            "paciente": "Carlos Eduardo Silva"
        })
        self.assertEqual(edit_res.status_code, 200)
        edit_data = edit_res.json()
        self.assertEqual(edit_data["leito"], "Leito UTI-05A")
        self.assertEqual(edit_data["paciente"], "Carlos Eduardo Silva")
        self.assertEqual(edit_data["criticidade"], "CRITICO")

        # 4. Limpar
        await self.client.delete(f"/api/simple/leitos/{leito_id}")

    async def test_08_pwa_manifest(self):
        res = await self.client.get("/manifest.json")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["short_name"], "Corrida de Leito")
        self.assertEqual(data["display"], "standalone")


if __name__ == "__main__":
    unittest.main()
