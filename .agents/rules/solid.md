# Rule: Princípios SOLID e Arquitetura de Código

## S — Single Responsibility Principle (Princípio da Responsabilidade Única)
- Cada módulo, classe ou função deve ter apenas uma razão para mudar.
- Separe apresentação (Controllers/UI), coordenação (Services/Use Cases), regras de negócio puras (Entities) e infraestrutura (Repositories).

## O — Open/Closed Principle (Princípio Aberto/Fechado)
- Entidades de software devem estar abertas para extensão, mas fechadas para modificação.
- Utilize composição, interfaces e polimorfismo para adicionar novos comportamentos sem alterar código existente testado.

## L — Liskov Substitution Principle (Princípio da Substituição de Liskov)
- Subclasses ou implementações devem ser substituíveis por seus tipos base sem alterar o comportamento correto do programa.
- Evite sobrescrever métodos lançando exceções de "não implementado".

## I — Interface Segregation Principle (Princípio da Segregação de Interfaces)
- Clientes não devem ser forçados a depender de interfaces que não utilizam.
- Prefira muitas interfaces pequenas e específicas a uma interface única e inchada.

## D — Dependency Inversion Principle (Princípio da Inversão de Dependência)
- Módulos de alto nível não devem depender de módulos de baixo nível; ambos devem depender de abstrações.
- Abstrações não devem depender de detalhes; detalhes devem depender de abstrações.
