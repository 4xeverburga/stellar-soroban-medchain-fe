Conclusiones

La problemática de los medicamentos falsificados y la falta de trazabilidad eficiente en la cadena de suministro farmacéutica en Perú (y América Latina en general) demanda una solución integral, innovadora y confiable. Implementar tecnología blockchain en este ámbito se presenta como una respuesta sólida y vanguardista, capaz de elevar los estándares de seguridad y transparencia muy por encima de lo que permiten los sistemas tradicionales. A lo largo de esta justificación hemos argumentado por qué:

    La trazabilidad es crítica para salvaguardar la salud pública en nuestra región, dadas las altas tasas de falsificación que erosionan la confianza y ponen en peligro vidas. Un control punto a punto de cada medicamento es imperativo para garantizar que solo productos legítimos y de calidad lleguen a los pacientes
    eceprograma.com
    alponiente.com
    .

    Los desafíos actuales en Perú incluyen un mercado infiltrado por productos ilegales y procedimientos de recall lentos y engorrosos, en parte por la ausencia de una plataforma unificada de seguimiento
    infobae.com
    infobae.com
    . Este vacío deja expuesta a la población y genera ineficiencias económicas para la industria formal.

    La tecnología blockchain (Stellar/Soroban) aborda estos problemas al proveer un registro inmutable y compartido de cada transacción en la cadena logística, imposible de adulterar y accesible en tiempo real para todos los involucrados. Esto crea un sistema de confianza distribuida donde la autenticidad de los medicamentos puede ser verificada de extremo a extremo
    consalud.es
    consalud.es
    . Stellar aporta la infraestructura idónea por su rapidez y bajos costos, mientras Soroban añade capacidad de automatización inteligente para robustecer controles y respuestas automáticas
    blockchain.oodles.io
    blockchain.oodles.io
    .

    La implementación de blockchain trae beneficios directos a fabricantes, distribuidores, farmacias y clínicas: protección de marca y cumplimiento regulatorio para los primeros; seguridad del inventario y eficiencia logística para los segundos; garantía de dispensación segura y simplificación operativa para los terceros; y en general una mejora en la calidad del servicio de salud para todos, al reducir falsificaciones, errores y tiempos de reacción
    gs1pe.org
    gs1pe.org
    .

    Experiencias internacionales en EE.UU., Europa y países latinoamericanos demuestran que la trazabilidad mejorada funciona y que blockchain es viable a escala industrial. Pilotos como MediLedger han exhibido la eficacia de blockchain para trazabilidad farmacéutica cumpliendo requerimientos regulatorios estrictos
    ledgerinsights.com
    , mientras que iniciativas regionales como N2Med en Brasil confirman que nuestros mercados también pueden beneficiarse de esta tecnología en la práctica
    tiinside.com.br
    . No partimos de cero: hay un camino trazado del cual podemos aprender y al cual podemos sumar a Perú como pionero en la región andina.

    Si bien hay retos regulatorios y de adopción, hemos delineado estrategias para enfrentarlos: trabajar de la mano con DIGEMID y autoridades en un marco normativo adecuado, usar estándares globales (GS1) para garantizar interoperabilidad
    gs1pe.org
    , implementar medidas de privacidad para proteger datos sensibles
    ledgerinsights.com
    , e introducir el sistema gradualmente mediante pilotos y fases que construyan confianza en los usuarios
    gs1pe.org
    . De esta forma, convertiremos posibles obstáculos en oportunidades de mejora continua, logrando que el blockchain se integre como pieza facilitadora dentro de la regulación sanitaria existente.

En conclusión, justificar la inversión y el esfuerzo en esta propuesta se sustenta en un hecho contundente: salvar vidas y asegurar medicamentos fiables no tiene precio, y la tecnología nos ofrece hoy las herramientas para hacerlo realidad. Blockchain proporcionará a Perú una cadena de suministro farmacéutica trazable, transparente y resiliente, donde la falsificación pueda ser prácticamente erradicada de los canales formales y donde cualquier incidente de calidad se gestione con rapidez quirúrgica. Esto no solo redundará en mayor seguridad para los pacientes peruanos, sino que fortalecerá la reputación del sistema de salud y de los productos farmacéuticos nacionales en el mundo. En una región golpeada por el comercio ilegal de medicinas, Perú puede liderar con el ejemplo adoptando un enfoque de vanguardia. La implementación de un sistema blockchain en la cadena de suministro farmacéutica será un hito de innovación tecnológica con impacto social palpable: la próxima vez que un peruano adquiera un medicamento, podrá tener la plena certeza (respaldada criptográficamente) de que ese producto es auténtico, eficaz y seguro.

1) Pitch escrito – 1 página (máx.)

Título del proyecto
MediTrack Latam – Trazabilidad de insumos y medicamentos con Stellar + Soroban

Problema
En Latinoamérica, la trazabilidad de medicamentos e insumos médicos es limitada y muchas veces manual. Esto facilita la circulación de productos falsificados, vencidos o mal almacenados, y ralentiza la respuesta ante alertas sanitarias. Según la OPS, hasta un 10% de medicamentos en países de ingresos bajos y medios son falsificados o de calidad inferior.

Solución
MediTrack Latam es una plataforma de trazabilidad que utiliza smart contracts en Soroban (sobre Stellar) para registrar, verificar y auditar el recorrido de cada unidad de medicamento o insumo médico, desde su fabricación hasta su dispensación.
El sistema:

    Registra eventos clave (commission, ship, receive, dispense) con datos únicos (GTIN, lote, serie, fecha de vencimiento).

    Permite verificar autenticidad en segundos escaneando un código DataMatrix.

    Lanza alertas y recalls instantáneos que bloquean la distribución de productos sospechosos o retirados.

    Mantiene privacidad: los datos sensibles se guardan off-chain y se anclan en blockchain como hash verificable.

    Roles controlados: fabricante, distribuidor, hospital/farmacia, regulador.

Tecnología

    Soroban Smart Contracts: lógica de negocio, control de roles, validación de estados, emisión de eventos.

    Stellar: red de baja latencia y bajo costo para operaciones frecuentes.

    Off-chain Store (PostgreSQL/IPFS): para almacenar datos EPCIS y GS1 completos.

    API Gateway + UI web: interacción segura y lectura de códigos 2D.

Impacto esperado

    Reducción drástica del tiempo de respuesta ante alertas sanitarias (de días a segundos).

    Prevención de distribución de medicamentos falsificados o retirados.

    Aumento de confianza en la cadena de suministro médico en LATAM.

    Potencial de escalamiento regional e integración con ministerios de salud.

Por qué Stellar/Soroban
La combinación de contratos Soroban y la infraestructura de Stellar nos permite ofrecer velocidad, bajo costo y seguridad en una región donde la conectividad es desigual y los recursos son limitados.
