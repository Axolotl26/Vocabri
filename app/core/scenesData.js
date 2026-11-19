// Vocabri — datos de las Escenas (diálogos guiados). Puro: solo datos.
// Cada escena alterna líneas de la otra persona (who:'npc') y tuyas (who:'you').
//   npc: { who:'npc', en, es }
//   you: { who:'you', goal:'lo que tienes que lograr (en español)', en, es, ref?:'id de la frase del mapa' }
// `ref` es el id de una frase que ya existe en el JSON (p. ej. 'trav_026'): los tests comprueban que el texto coincide.
const N = (en, es) => ({ who: 'npc', en, es });
// Decisión: eliges cómo hablar. Cada opción O(tono, en, es, consejo, [respuestas de la otra persona]) es válida, pero el tono cambia la reacción.
//   tono: 'great' (ideal) · 'ok' (aceptable) · 'off' (poco adecuado). No se castiga con XP: se explica el porqué.
const CH = (goal, choice) => ({ who: 'you', goal, choice });
const O = (fit, en, es, tip, reply) => ({ fit, en, es, tip, reply });
const Y = (goal, en, es, ref) => ref ? { who: 'you', goal, en, es, ref } : { who: 'you', goal, en, es };

export const SCENES = [
  { id: 'hotel', avatar: '🛎️', doodles: '🧳🛏️🔑🏨🌙', emoji: '🏨', title: 'Check-in en el hotel', cat: 'travel', group: 'viaje', level: 1, partner: 'Recepcionista',
    blurb: 'Llegas al hotel de noche y haces el registro.',
    turns: [
      N('Good evening, welcome to the Grand Hotel. How can I help you?', 'Buenas noches, bienvenido al Gran Hotel. ¿En qué puedo ayudarle?'),
      Y('Di que tienes una reserva a tu nombre.', 'I have a reservation under my name.', 'Tengo una reserva a mi nombre.', 'trav_026'),
      N('Of course. Could I see your passport, please?', 'Por supuesto. ¿Podría ver su pasaporte, por favor?'),
      Y('Entrégale tu pasaporte.', 'Here is my passport.', 'Aquí está mi pasaporte.'),
      N('Thank you. You are in room 304, on the third floor.', 'Gracias. Está en la habitación 304, en el tercer piso.'),
      Y('Pregunta a qué hora es el registro de entrada y salida.', 'What time is check-in and check-out?', '¿A qué hora es el registro de entrada y salida?', 'trav_027'),
      N('Check-out is at noon.', 'La salida es al mediodía.'),
      Y('Pregunta si el desayuno está incluido.', 'Is breakfast included in the price?', '¿El desayuno está incluido en el precio?', 'trav_028'),
      N('Yes, breakfast is served from seven to ten in the dining room.', 'Sí, el desayuno se sirve de siete a diez en el comedor.'),
      Y('Pide la contraseña del Wi-Fi.', 'Could you give me the Wi-Fi password?', '¿Podría darme la contraseña del Wi-Fi?', 'trav_039'),
      N('Sure, it is written on this card. Enjoy your stay!', 'Claro, está escrita en esta tarjeta. ¡Disfrute su estancia!'),
      Y('Agradece el buen servicio.', 'Thank you for the great service.', 'Gracias por el gran servicio.', 'trav_050')
    ] },

  { id: 'restaurant', avatar: '🧑‍🍳', doodles: '🍝🍷🍽️🥗🍰', emoji: '🍽️', title: 'Cenar en un restaurante', cat: 'travel', group: 'viaje', level: 1, partner: 'Camarero',
    blurb: 'Pides mesa, eliges tu plato y pagas la cuenta.',
    turns: [
      N('Good evening! Welcome. How can I help you?', '¡Buenas noches! Bienvenido. ¿En qué puedo ayudarle?'),
      Y('Pregunta si tienen una mesa disponible para esta noche.', 'Do you have a table available for tonight?', '¿Tienen una mesa disponible para esta noche?', 'trav_051'),
      N('Yes, we do. Here is the menu.', 'Sí, tenemos. Aquí tiene el menú.'),
      Y('Pregunta si hay opciones vegetarianas.', 'Do you have any vegetarian options?', '¿Tienen alguna opción vegetariana?', 'trav_053'),
      N('Of course. The vegetable pasta is very popular. Are you ready to order?', 'Claro. La pasta de verduras es muy popular. ¿Están listos para ordenar?'),
      Y('Di que ya están listos para ordenar.', 'We are ready to order.', 'Estamos listos para ordenar.', 'trav_058'),
      N('Perfect. And what would you like to drink?', 'Perfecto. ¿Y qué desean beber?'),
      Y('Pide un vaso de agua.', 'Could I have a glass of water, please?', '¿Me da un vaso de agua, por favor?', 'trav_056'),
      N('Right away. How was everything?', 'Enseguida. ¿Qué tal estuvo todo?'),
      Y('Di que todo estuvo delicioso.', 'Everything was delicious, thank you.', 'Todo estuvo delicioso, gracias.', 'trav_068'),
      N('I am glad you liked it. Is there anything else?', 'Me alegra que le gustara. ¿Algo más?'),
      Y('Pide la cuenta.', 'Could I get the check, please?', '¿Me trae la cuenta, por favor?', 'trav_061')
    ] },

  { id: 'airport', avatar: '🧑‍✈️', doodles: '✈️🧳🎫🛂🌍', emoji: '🛫', title: 'Facturar en el aeropuerto', cat: 'travel', group: 'viaje', level: 2, partner: 'Agente de la aerolínea',
    blurb: 'Facturas tu maleta, eliges asiento y buscas tu puerta.',
    turns: [
      N('Good morning. Can I help you?', 'Buenos días. ¿Puedo ayudarle?'),
      Y('Di que necesitas facturar tus maletas.', 'I need to check in my bags.', 'Necesito facturar mis maletas.', 'trav_002'),
      N('Of course. Where are you flying today?', 'Por supuesto. ¿A dónde vuela hoy?'),
      Y('Responde que vuelas a Madrid.', 'I am flying to Madrid.', 'Voy a volar a Madrid.'),
      N('Do you have a seat preference?', '¿Tiene alguna preferencia de asiento?'),
      Y('Pide un asiento de ventana.', 'I would like a window seat, please.', 'Me gustaría un asiento de ventana, por favor.', 'trav_010'),
      N('Done. Your gate is B12 and boarding starts at ten thirty.', 'Listo. Su puerta es la B12 y el embarque empieza a las diez y media.'),
      Y('Pregunta dónde está el control de seguridad.', 'Where is the security checkpoint?', '¿Dónde está el control de seguridad?', 'trav_016'),
      N('Straight ahead, then turn left.', 'Todo recto y luego gire a la izquierda.'),
      Y('Pregunta si el vuelo está a tiempo o retrasado.', 'Is this flight on time or delayed?', '¿Este vuelo está a tiempo o retrasado?', 'trav_003'),
      N('It is on time. Have a nice flight!', 'Está a tiempo. ¡Buen vuelo!'),
      Y('Dale las gracias.', 'Thank you very much.', 'Muchas gracias.')
    ] },

  { id: 'directions', avatar: '🧍', doodles: '🗺️🧭📍🚏🏙️', emoji: '🧭', title: 'Pedir direcciones en la calle', cat: 'travel', group: 'viaje', level: 1, partner: 'Un peatón',
    blurb: 'Estás perdido y buscas una farmacia.',
    turns: [
      N('Hello! You look a little lost. Can I help you?', '¡Hola! Parece un poco perdido. ¿Puedo ayudarle?'),
      Y('Di que estás perdido y pide ayuda.', 'I am lost, can you help me?', 'Estoy perdido, ¿puede ayudarme?', 'trav_077'),
      N('No problem. Where are you trying to go?', 'Sin problema. ¿A dónde quiere ir?'),
      Y('Pregunta dónde está la farmacia más cercana.', 'Excuse me, where is the nearest pharmacy?', 'Disculpe, ¿dónde está la farmacia más cercana?', 'trav_076'),
      N('Go straight for two blocks, then turn left at the next intersection.', 'Siga recto dos cuadras y luego gire a la izquierda en la siguiente intersección.'),
      Y('Pregunta qué tan lejos está a pie.', 'How far is it on foot?', '¿Qué tan lejos está a pie?', 'trav_083'),
      N('Only five minutes. It is right across the street from the bank.', 'Solo cinco minutos. Está justo al otro lado de la calle del banco.'),
      Y('Pregunta si es seguro caminar por ahí de noche.', 'Is it safe to walk around here at night?', '¿Es seguro caminar por aquí de noche?', 'trav_091'),
      N('Yes, it is a safe area, but stay on the main street.', 'Sí, es una zona segura, pero quédese en la calle principal.'),
      Y('Dale las gracias por su ayuda.', 'Thank you so much for your help!', '¡Muchas gracias por su ayuda!')
    ] },

  { id: 'interview', avatar: '👩‍💼', doodles: '💼📄🤝📈⭐', emoji: '💼', title: 'Entrevista de trabajo', cat: 'business', group: 'trabajo', level: 3, partner: 'Entrevistadora',
    blurb: 'Te presentas, hablas de tus fortalezas y haces tus preguntas.',
    turns: [
      N('Good morning, and thank you for coming in today.', 'Buenos días, y gracias por venir hoy.'),
      Y('Agradece que te reciban.', 'Thank you for having me today.', 'Gracias por recibirme hoy.', 'biz_101'),
      N('Please, take a seat. Could you tell me a little about yourself?', 'Por favor, siéntese. ¿Podría hablarme un poco de usted?'),
      Y('Cuéntale que te graduaste hace poco de ingeniería electrónica.', 'I recently graduated in electronic engineering.', 'Me gradué recientemente en ingeniería electrónica.', 'biz_105'),
      N('Great. What are your greatest strengths?', 'Muy bien. ¿Cuáles son sus mayores fortalezas?'),
      Y('Di que aprendes rápido y trabajas bien en equipo.', "I'm a quick learner and a team player.", 'Aprendo rápido y trabajo bien en equipo.', 'biz_110'),
      N('Can you give me an example of a challenge you overcame?', '¿Puede darme un ejemplo de un reto que haya superado?'),
      Y('Cuenta que tomaste la iniciativa para resolver el problema.', 'I took the initiative to solve the problem.', 'Tomé la iniciativa para resolver el problema.', 'biz_116'),
      N('Where do you see yourself in five years?', '¿Dónde se ve dentro de cinco años?'),
      Y('Responde que te ves creciendo dentro de la empresa.', 'I see myself growing within the company.', 'Me veo creciendo dentro de la empresa.', 'biz_120'),
      N('Do you have any questions for us?', '¿Tiene alguna pregunta para nosotros?'),
      Y('Pregunta por las oportunidades de crecimiento profesional.', 'What are the opportunities for professional growth?', '¿Cuáles son las oportunidades de crecimiento profesional?', 'biz_127'),
      N('We will be in touch very soon.', 'Nos pondremos en contacto muy pronto.'),
      Y('Despídete diciendo que fue un placer hablar con ella.', 'It was a pleasure speaking with you.', 'Fue un placer hablar con usted.', 'biz_130')
    ] },

  { id: 'professor', avatar: '👨‍🏫', doodles: '📚✏️📐🎓💡', emoji: '🎓', title: 'Hablar con tu profesor', cat: 'academic', group: 'estudio', level: 2, partner: 'Profesor',
    blurb: 'Vas a su oficina con una duda sobre la tarea.',
    turns: [
      N('Hello, come in. How can I help you?', 'Hola, pase. ¿En qué puedo ayudarle?'),
      Y('Di que tienes una pregunta sobre la tarea.', 'I have a question about the homework.', 'Tengo una pregunta sobre la tarea.', 'acad_005'),
      N('Of course. What is the problem?', 'Claro. ¿Cuál es el problema?'),
      Y('Explica que no entiendes esta fórmula matemática.', "I don't understand this mathematical formula.", 'No entiendo esta fórmula matemática.', 'acad_020'),
      N('Let me show you. We start with the second term.', 'Déjeme mostrárselo. Empezamos con el segundo término.'),
      Y('Pídele que explique el problema de nuevo.', 'Could you explain this problem again?', '¿Podría explicar este problema de nuevo?', 'acad_004'),
      N('Sure. Let us go step by step. Is it clearer now?', 'Claro. Vamos paso a paso. ¿Está más claro ahora?'),
      Y('Pregunta cuál es la fecha límite de la tarea.', 'When is the deadline for this assignment?', '¿Cuál es la fecha límite para esta tarea?', 'acad_001'),
      N('You have until Friday.', 'Tiene hasta el viernes.'),
      Y('Pregunta de cuántas palabras debe ser el ensayo.', 'How many words should the essay be?', '¿De cuántas palabras debe ser el ensayo?', 'acad_021'),
      N('About a thousand words.', 'Alrededor de mil palabras.'),
      Y('Dale las gracias y despídete.', 'Thank you, professor. See you in class!', 'Gracias, profesor. ¡Nos vemos en clase!')
    ] },

  { id: 'taxi', avatar: '🚖', doodles: '🚕🏙️🧭💵🌃', emoji: '🚕', title: 'Tomar un taxi', cat: 'travel', group: 'viaje', level: 1, partner: 'Taxista',
    blurb: 'Paras un taxi y le pides que te lleve al centro.',
    turns: [
      N('Hello! Where are you going?', '¡Hola! ¿A dónde va?'),
      Y('Pide que te lleve al centro de la ciudad.', 'Could you take me to the city center, please?', '¿Podría llevarme al centro de la ciudad, por favor?'),
      N('Sure. Get in.', 'Claro. Suba.'),
      Y('Pregunta cuánto tiempo tardará.', 'How long will it take?', '¿Cuánto tiempo tardará?'),
      N('About twenty minutes, with traffic.', 'Unos veinte minutos, con el tráfico.'),
      Y('Pregunta cuánto costará el viaje.', 'How much will the ride cost?', '¿Cuánto costará el viaje?'),
      N('Around fifteen dollars.', 'Unos quince dólares.'),
      Y('Pídele que se detenga en la esquina.', 'Please stop at the corner.', 'Por favor, deténgase en la esquina.'),
      N('Here we are. That is fifteen dollars.', 'Ya llegamos. Son quince dólares.'),
      Y('Dale el dinero y dile que se quede con el cambio.', 'Here you go. Keep the change.', 'Aquí tiene. Quédese con el cambio.'),
      N('Thank you! Have a nice day.', '¡Gracias! Que tenga un buen día.'),
      Y('Despídete con amabilidad.', 'You too, goodbye!', '¡Igualmente, adiós!')
    ] },

  { id: 'pharmacy', avatar: '👨‍⚕️', doodles: '💊🩹🌡️🧴❤️', emoji: '💊', title: 'En la farmacia', cat: 'travel', group: 'viaje', level: 1, partner: 'Farmacéutico',
    blurb: 'No te sientes bien y pides algo para el dolor.',
    turns: [
      N('Good afternoon. Can I help you?', 'Buenas tardes. ¿Puedo ayudarle?'),
      Y('Di que tienes dolor de cabeza.', 'I have a headache.', 'Tengo dolor de cabeza.'),
      N('I am sorry to hear that. Do you have a fever?', 'Lamento oírlo. ¿Tiene fiebre?'),
      Y('Responde que no tienes fiebre.', 'No, I do not have a fever.', 'No, no tengo fiebre.'),
      N('Okay. This medicine should help.', 'De acuerdo. Esta medicina debería ayudar.'),
      Y('Pregunta cuántas pastillas debes tomar.', 'How many pills should I take?', '¿Cuántas pastillas debo tomar?'),
      N('One pill every eight hours, after eating.', 'Una pastilla cada ocho horas, después de comer.'),
      Y('Pregunta si tiene efectos secundarios.', 'Does it have any side effects?', '¿Tiene algún efecto secundario?'),
      N('It can make you a little sleepy.', 'Puede darle un poco de sueño.'),
      Y('Pregunta cuánto cuesta.', 'How much is it?', '¿Cuánto cuesta?'),
      N('It is eight dollars.', 'Son ocho dólares.'),
      Y('Paga y agradece la ayuda.', 'Here you go. Thanks for your help.', 'Aquí tiene. Gracias por su ayuda.')
    ] },

  { id: 'doctor', avatar: '👩‍⚕️', doodles: '🩺💉🌡️❤️🏥', emoji: '🩺', title: 'Ir al médico', cat: 'travel', group: 'viaje', level: 2, partner: 'Doctora',
    blurb: 'Explicas tus síntomas en una consulta.',
    turns: [
      N('Hello, please sit down. What seems to be the problem?', 'Hola, siéntese, por favor. ¿Cuál parece ser el problema?'),
      Y('Di que no te sientes bien desde ayer.', 'I have not been feeling well since yesterday.', 'No me siento bien desde ayer.'),
      N('What are your symptoms?', '¿Cuáles son sus síntomas?'),
      Y('Explica que te duele la garganta y tienes tos.', 'I have a sore throat and a cough.', 'Me duele la garganta y tengo tos.'),
      N('Let me check. Open your mouth, please.', 'Déjeme revisar. Abra la boca, por favor.'),
      Y('Pregunta si es algo grave.', 'Is it something serious?', '¿Es algo grave?'),
      N('No, it looks like a common cold.', 'No, parece un resfriado común.'),
      Y('Pregunta si necesitas tomar medicinas.', 'Do I need to take any medicine?', '¿Necesito tomar alguna medicina?'),
      N('Yes, I will write you a prescription. Also, drink a lot of water and rest.', 'Sí, le haré una receta. Además, beba mucha agua y descanse.'),
      Y('Pregunta cuántos días debes descansar.', 'How many days should I rest?', '¿Cuántos días debo descansar?'),
      N('Two or three days. Come back if you feel worse.', 'Dos o tres días. Vuelva si se siente peor.'),
      Y('Agradece y di que seguirás sus indicaciones.', 'Thank you, doctor. I will follow your advice.', 'Gracias, doctora. Seguiré sus consejos.')
    ] },

  { id: 'shopping', avatar: '🛍️', doodles: '👗👟🧥🏷️💳', emoji: '🛍️', title: 'Comprar ropa', cat: 'travel', group: 'diario', level: 1, partner: 'Vendedora',
    blurb: 'Buscas una chaqueta de tu talla y pagas.',
    turns: [
      N('Hi there! Are you looking for something special?', '¡Hola! ¿Busca algo en especial?'),
      Y('Di que buscas una chaqueta.', 'I am looking for a jacket.', 'Estoy buscando una chaqueta.'),
      N('We have a few new ones here. What size are you?', 'Tenemos algunas nuevas aquí. ¿Qué talla usa?'),
      Y('Di que usas talla mediana.', 'I am a medium.', 'Uso talla mediana.'),
      N('Here you go. The fitting rooms are over there.', 'Aquí tiene. Los probadores están por allá.'),
      Y('Pregunta si puedes probártela.', 'Can I try it on?', '¿Puedo probármela?'),
      N('Of course. How does it fit?', 'Claro. ¿Cómo le queda?'),
      Y('Di que te queda un poco grande y pide una talla menor.', 'It is a bit big. Do you have a smaller size?', 'Me queda un poco grande. ¿Tiene una talla más pequeña?'),
      N('Yes, here is a small. It is on sale today.', 'Sí, aquí tiene una pequeña. Hoy está en oferta.'),
      Y('Pregunta cuánto cuesta con el descuento.', 'How much is it with the discount?', '¿Cuánto cuesta con el descuento?'),
      N('Forty dollars. Cash or card?', 'Cuarenta dólares. ¿Efectivo o tarjeta?'),
      Y('Di que pagarás con tarjeta.', 'I will pay by card.', 'Pagaré con tarjeta.')
    ] },

  { id: 'phonecall', avatar: '☎️', doodles: '📞💬📋🕑✉️', emoji: '📞', title: 'Llamada de teléfono', cat: 'business', group: 'diario', level: 2, partner: 'Recepcionista',
    blurb: 'Llamas para hablar con alguien que no está disponible.',
    turns: [
      N('Good morning, Tech Solutions. How may I direct your call?', 'Buenos días, Tech Solutions. ¿A quién desea comunicarse?'),
      Y('Pide hablar con la señora Smith.', 'Could I speak with Mrs. Smith, please?', '¿Podría hablar con la señora Smith, por favor?'),
      N('I am sorry, she is in a meeting right now.', 'Lo siento, está en una reunión en este momento.'),
      Y('Pregunta cuándo estará disponible.', 'When will she be available?', '¿Cuándo estará disponible?'),
      N('She should be free after two o clock.', 'Debería estar libre después de las dos.'),
      Y('Pide dejar un mensaje.', 'Can I leave a message?', '¿Puedo dejar un mensaje?'),
      N('Of course. What is your name and number?', 'Claro. ¿Cuál es su nombre y número?'),
      Y('Da tu nombre y pide que te devuelva la llamada.', 'My name is Alex. Please ask her to call me back.', 'Me llamo Alex. Por favor, pídale que me devuelva la llamada.'),
      N('Could you spell your last name, please?', '¿Podría deletrear su apellido, por favor?'),
      Y('Pide que repita el número porque no escuchaste bien.', 'Sorry, could you repeat that? I did not hear you well.', 'Perdón, ¿podría repetir eso? No le escuché bien.'),
      N('No problem. I will give her the message.', 'Sin problema. Le daré el mensaje.'),
      Y('Agradece y cuelga con educación.', 'Thank you very much. Goodbye!', '¡Muchas gracias. Adiós!')
    ] },

  { id: 'bank', avatar: '🏦', doodles: '💳💰🏦📑🔒', emoji: '🏦', title: 'En el banco', cat: 'business', group: 'diario', level: 2, partner: 'Cajero',
    blurb: 'Quieres abrir una cuenta y pedir una tarjeta.',
    turns: [
      N('Welcome to the bank. How can I help you today?', 'Bienvenido al banco. ¿En qué puedo ayudarle hoy?'),
      Y('Di que quieres abrir una cuenta de ahorros.', 'I would like to open a savings account.', 'Me gustaría abrir una cuenta de ahorros.'),
      N('Certainly. Do you have an ID with you?', 'Por supuesto. ¿Trae una identificación?'),
      Y('Responde que sí y muéstrala.', 'Yes, here is my ID.', 'Sí, aquí está mi identificación.'),
      N('Thank you. Please fill out this form.', 'Gracias. Por favor, llene este formulario.'),
      Y('Pregunta si hay una comisión mensual.', 'Is there a monthly fee?', '¿Hay una comisión mensual?'),
      N('No, there is no fee for students.', 'No, no hay comisión para estudiantes.'),
      Y('Pregunta cuánto tarda en llegar la tarjeta.', 'How long will the card take to arrive?', '¿Cuánto tardará en llegar la tarjeta?'),
      N('About a week. We will send it to your address.', 'Una semana, más o menos. La enviaremos a su dirección.'),
      Y('Pregunta si puedes usar la app del banco.', 'Can I use the mobile app?', '¿Puedo usar la aplicación del banco?'),
      N('Yes, you will get an email to set it up.', 'Sí, recibirá un correo para configurarla.'),
      Y('Agradece y despídete.', 'Great, thank you for your help.', 'Perfecto, gracias por su ayuda.')
    ] },

  { id: 'coffee', avatar: '☕', doodles: '☕🥐🍰🧁🍪', emoji: '☕', title: 'Pedir en una cafetería', cat: 'travel', group: 'diario', level: 1, partner: 'Barista',
    blurb: 'Pides tu café y algo de comer.',
    turns: [
      N('Hi! What can I get for you?', '¡Hola! ¿Qué le sirvo?'),
      Y('Pide un café con leche grande.', 'A large latte, please.', 'Un café con leche grande, por favor.'),
      N('Sure. For here or to go?', 'Claro. ¿Para tomar aquí o para llevar?'),
      Y('Di que es para llevar.', 'To go, please.', 'Para llevar, por favor.'),
      N('Would you like anything to eat?', '¿Desea algo de comer?'),
      Y('Pregunta qué postres tienen.', 'What desserts do you have?', '¿Qué postres tienen?'),
      N('We have cheesecake and chocolate cake.', 'Tenemos pastel de queso y pastel de chocolate.'),
      Y('Pide un trozo de pastel de chocolate.', 'I will have a slice of chocolate cake.', 'Quiero un trozo de pastel de chocolate.'),
      N('That is nine dollars in total.', 'Son nueve dólares en total.'),
      Y('Pregunta si aceptan tarjeta.', 'Do you accept credit cards?', '¿Aceptan tarjetas de crédito?'),
      N('Yes, we do. Your order will be ready in a minute.', 'Sí. Su pedido estará listo en un minuto.'),
      Y('Agradece y di que tenga buen día.', 'Thanks, have a good one!', '¡Gracias, que tenga un buen día!')
    ] },

  { id: 'newfriend', avatar: '🙂', doodles: '👋🎶🍕💬🎉', emoji: '🤝', title: 'Conocer a alguien', cat: 'social', group: 'social', level: 1, partner: 'Una persona nueva',
    blurb: 'Te presentas en una fiesta y charlas un rato.',
    turns: [
      N('Hi! I do not think we have met. I am Sam.', '¡Hola! Creo que no nos conocemos. Soy Sam.'),
      Y('Preséntate y di que mucho gusto.', 'Nice to meet you, I am Alex.', 'Mucho gusto, soy Alex.'),
      N('Where are you from?', '¿De dónde eres?'),
      Y('Di que eres de Venezuela.', 'I am from Venezuela.', 'Soy de Venezuela.'),
      N('Cool! What do you do?', '¡Genial! ¿A qué te dedicas?'),
      Y('Di que eres estudiante de ingeniería.', 'I am an engineering student.', 'Soy estudiante de ingeniería.'),
      N('Nice! Do you like it?', '¡Qué bien! ¿Te gusta?'),
      Y('Responde que sí, aunque es difícil.', 'Yes, I love it, but it is hard.', 'Sí, me encanta, pero es difícil.'),
      N('I bet. What do you do in your free time?', 'Me imagino. ¿Qué haces en tu tiempo libre?'),
      Y('Di que te gusta jugar videojuegos y ver series.', 'I like playing video games and watching series.', 'Me gusta jugar videojuegos y ver series.'),
      N('Same here! We should hang out sometime.', '¡Igual yo! Deberíamos salir algún día.'),
      Y('Acepta con gusto.', 'Sure, that sounds great!', '¡Claro, suena genial!')
    ] },

  { id: 'invite', avatar: '😎', doodles: '🎬🍿🎟️🕕📱', emoji: '🎉', title: 'Invitar a un plan', cat: 'social', group: 'social', level: 1, partner: 'Tu amigo Sam',
    blurb: 'Propones un plan para el fin de semana y lo organizas.',
    turns: [
      N('Hey! What is up?', '¡Hola! ¿Qué tal?'),
      Y('Pregunta qué hará el sábado.', 'What are you doing on Saturday?', '¿Qué vas a hacer el sábado?'),
      N('Nothing special. Why?', 'Nada especial. ¿Por qué?'),
      Y('Invítalo al cine.', 'Do you want to go to the movies?', '¿Quieres ir al cine?'),
      N('Sounds good! What movie?', '¡Suena bien! ¿Qué película?'),
      Y('Propón ver la nueva película de acción.', 'How about the new action movie?', '¿Qué tal la nueva película de acción?'),
      N('Great. What time?', 'Genial. ¿A qué hora?'),
      Y('Propón las seis de la tarde.', 'Let us meet at six in the evening.', 'Encontrémonos a las seis de la tarde.'),
      N('Perfect. Where should we meet?', 'Perfecto. ¿Dónde nos vemos?'),
      Y('Propón verse frente al cine.', 'Let us meet in front of the cinema.', 'Veámonos frente al cine.'),
      N('Okay! I will be there.', '¡Está bien! Allí estaré.'),
      Y('Despídete hasta el sábado.', 'Great, see you on Saturday!', '¡Genial, nos vemos el sábado!')
    ] },

  { id: 'complaint', avatar: '🎧', doodles: '📦💥📧✅🧾', emoji: '😠', title: 'Hacer un reclamo', cat: 'business', group: 'diario', level: 2, partner: 'Atención al cliente',
    blurb: 'Compraste algo que llegó dañado y pides solución.',
    turns: [
      N('Customer service, how can I help you?', 'Atención al cliente, ¿en qué puedo ayudarle?'),
      Y('Explica que tu pedido llegó dañado.', 'My order arrived damaged.', 'Mi pedido llegó dañado.'),
      N('I am very sorry. Can you tell me your order number?', 'Lo lamento mucho. ¿Puede darme su número de pedido?'),
      Y('Di que ahora mismo buscas el número.', 'Yes, one moment, I will look for it.', 'Sí, un momento, lo voy a buscar.'),
      N('Thank you. I can see the problem in the system.', 'Gracias. Veo el problema en el sistema.'),
      Y('Pide un reembolso completo.', 'I would like a full refund, please.', 'Quisiera un reembolso completo, por favor.'),
      N('We can also send you a new one for free.', 'También podemos enviarle uno nuevo gratis.'),
      Y('Prefieres que te manden uno nuevo.', 'I prefer a replacement, thank you.', 'Prefiero un reemplazo, gracias.'),
      N('Okay. It will arrive in five business days.', 'De acuerdo. Llegará en cinco días hábiles.'),
      Y('Pregunta si recibirás un correo de confirmación.', 'Will I get a confirmation email?', '¿Recibiré un correo de confirmación?'),
      N('Yes, in a few minutes.', 'Sí, en unos minutos.'),
      Y('Agradece la ayuda.', 'Thank you for solving this so quickly.', 'Gracias por resolver esto tan rápido.')
    ] },

  { id: 'office', avatar: '🧑‍💼', doodles: '💻📊🗓️💡📎', emoji: '🧑‍💻', title: 'Reunión de equipo', cat: 'business', group: 'trabajo', level: 2, partner: 'Tu jefe',
    blurb: 'Das tu avance en un proyecto y propones una idea.',
    turns: [
      N('Good morning, everyone. Let us start. Alex, how is your part going?', 'Buenos días a todos. Empecemos. Alex, ¿cómo va tu parte?'),
      Y('Di que vas bien y casi terminas.', 'It is going well. I am almost done.', 'Va bien. Ya casi termino.'),
      N('Great. Do you have any problems?', 'Genial. ¿Tienes algún problema?'),
      Y('Explica que tuviste un error en el código.', 'I had a bug in the code, but I fixed it.', 'Tuve un error en el código, pero lo arreglé.'),
      N('Good. When can you finish?', 'Bien. ¿Cuándo puedes terminar?'),
      Y('Promete entregarlo el jueves.', 'I can deliver it by Thursday.', 'Puedo entregarlo para el jueves.'),
      N('Perfect. Does anyone have any ideas?', 'Perfecto. ¿Alguien tiene ideas?'),
      Y('Propón una idea.', 'I have an idea. We could automate this step.', 'Tengo una idea. Podríamos automatizar este paso.'),
      N('Interesting. How would that work?', 'Interesante. ¿Cómo funcionaría?'),
      Y('Explica que ahorraría tiempo.', 'It would save us a lot of time.', 'Nos ahorraría mucho tiempo.'),
      N('Good idea. Let us try it next week.', 'Buena idea. Probémoslo la próxima semana.'),
      Y('Ofrécete a encargarte.', 'I can take care of it.', 'Yo puedo encargarme.')
    ] },

  { id: 'techhelp', avatar: '🧑‍🔧', doodles: '🖥️🔌🛠️💾⚙️', emoji: '🛠️', title: 'Pedir ayuda técnica', cat: 'business', group: 'trabajo', level: 2, partner: 'Soporte técnico',
    blurb: 'Tu computadora falla y llamas a soporte.',
    turns: [
      N('Technical support. What is the issue?', 'Soporte técnico. ¿Cuál es el problema?'),
      Y('Di que tu computadora no enciende.', 'My computer does not turn on.', 'Mi computadora no enciende.'),
      N('Is it plugged in?', '¿Está conectada?'),
      Y('Responde que sí, ya lo revisaste.', 'Yes, I already checked that.', 'Sí, ya revisé eso.'),
      N('Do you see any lights or hear any sounds?', '¿Ve alguna luz o escucha algún sonido?'),
      Y('Di que no hay luces ni sonidos.', 'There are no lights and no sounds.', 'No hay luces ni sonidos.'),
      N('It might be the power supply. Did it fall or get wet?', 'Puede ser la fuente de poder. ¿Se cayó o se mojó?'),
      Y('Responde que no pasó nada raro.', 'No, nothing strange happened.', 'No, no pasó nada raro.'),
      N('Okay, we need to check it in person.', 'De acuerdo, tenemos que revisarla en persona.'),
      Y('Pregunta si pueden repararla hoy.', 'Can you fix it today?', '¿Pueden repararla hoy?'),
      N('Yes, bring it before five.', 'Sí, tráigala antes de las cinco.'),
      Y('Confirma que irás pronto.', 'Great, I will be there soon.', 'Perfecto, estaré allí pronto.')
    ] },

  { id: 'presentation', avatar: '🧑‍⚖️', doodles: '📊🌱💧🔬📐', emoji: '📊', title: 'Presentar un proyecto', cat: 'academic', group: 'estudio', level: 3, partner: 'Jurado',
    blurb: 'Defiendes tu proyecto de ingeniería ante un jurado.',
    turns: [
      N('Good afternoon. Please begin your presentation.', 'Buenas tardes. Por favor, comience su presentación.'),
      Y('Saluda y di de qué trata tu proyecto.', 'Good afternoon. My project is about a smart irrigation system.', 'Buenas tardes. Mi proyecto trata de un sistema de riego inteligente.'),
      N('Interesting. What problem does it solve?', 'Interesante. ¿Qué problema resuelve?'),
      Y('Explica que ahorra agua.', 'It helps save water in small gardens.', 'Ayuda a ahorrar agua en jardines pequeños.'),
      N('How does it work?', '¿Cómo funciona?'),
      Y('Explica que un sensor mide la humedad.', 'A sensor measures the soil moisture.', 'Un sensor mide la humedad del suelo.'),
      N('And what happens next?', 'Y luego, ¿qué pasa?'),
      Y('Explica que el sistema abre la válvula solo.', 'Then the system opens the valve automatically.', 'Luego el sistema abre la válvula automáticamente.'),
      N('What were the main challenges?', '¿Cuáles fueron los principales desafíos?'),
      Y('Di que fue difícil calibrar el sensor.', 'The hardest part was calibrating the sensor.', 'Lo más difícil fue calibrar el sensor.'),
      N('Very good. Do you have any final comments?', 'Muy bien. ¿Tiene algún comentario final?'),
      Y('Agradece al jurado.', 'Thank you for your time and your questions.', 'Gracias por su tiempo y sus preguntas.')
    ] },

  { id: 'extension', avatar: '👩‍🏫', doodles: '📝⏳📅📚✅', emoji: '📝', title: 'Pedir una prórroga', cat: 'academic', group: 'estudio', level: 2, partner: 'Profesora',
    blurb: 'Necesitas más tiempo para entregar un trabajo.',
    turns: [
      N('Hello. Did you want to talk to me?', 'Hola. ¿Quería hablar conmigo?'),
      Y('Pregunta si tiene un minuto.', 'Do you have a minute?', '¿Tiene un minuto?'),
      N('Of course. What is it?', 'Claro. ¿Qué pasa?'),
      Y('Explica que no terminarás a tiempo.', 'I will not be able to finish on time.', 'No podré terminar a tiempo.'),
      N('Why not?', '¿Por qué no?'),
      Y('Explica que estuviste enfermo.', 'I was sick last week.', 'Estuve enfermo la semana pasada.'),
      N('I am sorry to hear that. How much time do you need?', 'Lamento oírlo. ¿Cuánto tiempo necesita?'),
      Y('Pide dos días más.', 'Could I have two more days?', '¿Podría tener dos días más?'),
      N('Okay, but no more than that.', 'Está bien, pero no más que eso.'),
      Y('Promete entregarlo el lunes.', 'I promise I will turn it in on Monday.', 'Prometo que lo entregaré el lunes.'),
      N('Fine. Take care of yourself.', 'Bien. Cuídese.'),
      Y('Agradece su comprensión.', 'Thank you for understanding.', 'Gracias por su comprensión.')
    ] },

  { id: 'library', avatar: '🧑‍🏫', doodles: '📖📚🔎🤫🪑', emoji: '📚', title: 'En la biblioteca', cat: 'academic', group: 'estudio', level: 1, partner: 'Bibliotecario',
    blurb: 'Buscas un libro y pides un préstamo.',
    turns: [
      N('Hello! Can I help you find something?', '¡Hola! ¿Puedo ayudarle a encontrar algo?'),
      Y('Di que buscas un libro de física.', 'I am looking for a physics book.', 'Estoy buscando un libro de física.'),
      N('Sure. Do you know the title?', 'Claro. ¿Sabe el título?'),
      Y('Di que no lo sabes, pero es para primer año.', 'No, but it is for first-year students.', 'No, pero es para estudiantes de primer año.'),
      N('I found a few. Here is one.', 'Encontré algunos. Aquí hay uno.'),
      Y('Pregunta si puedes llevártelo prestado.', 'Can I borrow it?', '¿Puedo llevármelo prestado?'),
      N('Yes, with your student card.', 'Sí, con su carnet de estudiante.'),
      Y('Pregunta por cuántos días.', 'For how many days can I keep it?', '¿Por cuántos días puedo quedármelo?'),
      N('Two weeks. You can renew it once.', 'Dos semanas. Puede renovarlo una vez.'),
      Y('Pregunta dónde puedes estudiar en silencio.', 'Where can I study quietly?', '¿Dónde puedo estudiar en silencio?'),
      N('The second floor is the quiet zone.', 'El segundo piso es la zona de silencio.'),
      Y('Agradece la ayuda.', 'Thanks a lot for your help.', 'Muchas gracias por su ayuda.')
    ] },

  { id: 'groupwork', avatar: '🧑‍🎓', doodles: '👥📝💻🗂️🤝', emoji: '👥', title: 'Trabajo en grupo', cat: 'academic', group: 'estudio', level: 2, partner: 'Compañero de clase',
    blurb: 'Se reparten las tareas de un proyecto en equipo.',
    turns: [
      N('Hey, so we need to split the work. Any ideas?', 'Oye, hay que repartir el trabajo. ¿Alguna idea?'),
      Y('Propón dividir el proyecto en tres partes.', 'Let us split the project into three parts.', 'Dividamos el proyecto en tres partes.'),
      N('Good. Which part do you want?', 'Bien. ¿Qué parte quieres?'),
      Y('Elige la parte de programación.', 'I will do the programming part.', 'Yo haré la parte de programación.'),
      N('Great. I can write the report.', 'Genial. Yo puedo escribir el informe.'),
      Y('Pregunta cuándo deben terminar cada uno.', 'When do we each need to finish?', '¿Cuándo debemos terminar cada uno?'),
      N('Let us say next Wednesday.', 'Digamos que el próximo miércoles.'),
      Y('Propón reunirse el jueves para unir todo.', 'Let us meet on Thursday to put everything together.', 'Reunámonos el jueves para juntar todo.'),
      N('Works for me. Where?', 'Me parece bien. ¿Dónde?'),
      Y('Propón la biblioteca.', 'How about the library?', '¿Qué tal la biblioteca?'),
      N('Perfect. Send me your part when it is ready.', 'Perfecto. Envíame tu parte cuando esté lista.'),
      Y('Dile que se la mandarás por correo.', 'Sure, I will send it by email.', 'Claro, te la enviaré por correo.')
    ] },

  { id: 'apartment', avatar: '🏠', doodles: '🏠🔑🛋️🛏️🚿', emoji: '🏠', title: 'Alquilar un apartamento', cat: 'business', group: 'diario', level: 3, partner: 'Propietaria',
    blurb: 'Visitas un apartamento y preguntas las condiciones.',
    turns: [
      N('Hello! Come in. This is the apartment.', '¡Hola! Pase. Este es el apartamento.'),
      Y('Di que te gusta y pregunta cuántas habitaciones tiene.', 'It looks nice. How many bedrooms does it have?', 'Se ve bonito. ¿Cuántas habitaciones tiene?'),
      N('It has two bedrooms and one bathroom.', 'Tiene dos habitaciones y un baño.'),
      Y('Pregunta cuánto es el alquiler mensual.', 'How much is the monthly rent?', '¿Cuánto es el alquiler mensual?'),
      N('Six hundred dollars a month.', 'Seiscientos dólares al mes.'),
      Y('Pregunta si los servicios están incluidos.', 'Are utilities included?', '¿Los servicios están incluidos?'),
      N('Water is included, but electricity is not.', 'El agua está incluida, pero la electricidad no.'),
      Y('Pregunta si se permiten mascotas.', 'Are pets allowed?', '¿Se permiten mascotas?'),
      N('Small pets are fine.', 'Las mascotas pequeñas están bien.'),
      Y('Pregunta si necesitas pagar un depósito.', 'Do I need to pay a deposit?', '¿Necesito pagar un depósito?'),
      N('Yes, one month in advance.', 'Sí, un mes por adelantado.'),
      Y('Di que lo pensarás y la llamarás mañana.', 'I will think about it and call you tomorrow.', 'Lo pensaré y la llamaré mañana.')
    ] },

  // ───── Escenas con decisiones (elige el tono) ─────
  { id: 'dayoff', avatar: '👩‍💼', doodles: '📅☀️💼🗓️✅', emoji: '🗓️', title: 'Pedirle un día libre a tu jefa', cat: 'business', group: 'trabajo', level: 2, partner: 'Tu jefa, Ms. Carter',
    blurb: 'Necesitas un día libre y tienes que elegir bien cómo pedirlo.',
    turns: [
      N('Good morning! Come in. What can I do for you?', 'Buenos días. Pasa. ¿En qué puedo ayudarte?'),
      CH('Pídele un momento para hablar.', [
        O('great', 'Do you have a moment? I would like to ask you something.', '¿Tiene un momento? Me gustaría pedirle algo.', 'Formal y amable: ideal para hablar con tu jefa.', [N('Of course. Please, sit down.', 'Claro. Por favor, siéntate.')]),
        O('ok', 'Can I ask you something quickly?', '¿Puedo preguntarle algo rápido?', 'Correcto, aunque un poco directo.', [N('Sure, go ahead.', 'Claro, adelante.')]),
        O('off', 'Hey boss! I need a day off, okay?', '¡Oye, jefa! Necesito un día libre, ¿vale?', 'Demasiado informal y brusco para tu jefa.', [N('Hmm. Okay... tell me more.', 'Mmm. Vale... cuéntame más.')])
      ]),
      Y('Explica que necesitas el próximo viernes libre.', 'I need to take next Friday off.', 'Necesito tomarme libre el próximo viernes.'),
      N('I see. Is it for a special reason?', 'Entiendo. ¿Es por alguna razón especial?'),
      Y('Explica que tienes una cita con tu médico.', 'Yes, I have an appointment with my doctor.', 'Sí, tengo una cita con mi médico.'),
      N('Okay. Can you finish your report before you leave?', 'De acuerdo. ¿Puedes terminar tu informe antes de irte?'),
      CH('Responde si podrás entregarlo antes.', [
        O('great', 'Yes, I will finish it by Thursday afternoon.', 'Sí, lo terminaré el jueves por la tarde.', 'Claro y profesional: das una fecha concreta.', [N('Perfect. Then it is approved.', 'Perfecto. Entonces está aprobado.')]),
        O('ok', 'I will try to finish it before Friday.', 'Intentaré terminarlo antes del viernes.', '«I will try» suena menos seguro que «I will».', [N('Alright. It is approved, but please send it on time.', 'De acuerdo. Está aprobado, pero por favor envíalo a tiempo.')]),
        O('off', 'Maybe. I have a lot of work.', 'Quizás. Tengo mucho trabajo.', 'Suena a excusa: mejor comprometerte con una fecha.', [N('Hmm. I will approve it, but I need it on time, please.', 'Mmm. Lo aprobaré, pero lo necesito a tiempo, por favor.')])
      ]),
      Y('Agradece que te lo permita.', 'Thank you so much for understanding.', 'Muchas gracias por entenderlo.')
    ] },

  { id: 'lateclass', avatar: '👨‍🏫', doodles: '⏱📚🚏✏️🎓', emoji: '⏱', title: 'Llegar tarde a clase', cat: 'academic', group: 'estudio', level: 2, partner: 'Profesor Davis',
    blurb: 'Llegas tarde y tienes que disculparte con tu profesor.',
    turns: [
      N('You are late. The class started twenty minutes ago.', 'Llegas tarde. La clase empezó hace veinte minutos.'),
      CH('Pide disculpas por llegar tarde.', [
        O('great', 'I am very sorry for being late, Professor.', 'Lamento mucho llegar tarde, profesor.', 'Formal y respetuoso: justo lo que espera un profesor.', [N('Thank you for apologizing. What happened?', 'Gracias por disculparte. ¿Qué pasó?')]),
        O('ok', 'Sorry I am late.', 'Perdón por llegar tarde.', 'Correcto, pero algo corto para un profesor.', [N('Okay. What happened?', 'Bien. ¿Qué pasó?')]),
        O('off', 'Yeah, whatever. The traffic was crazy.', 'Sí, bueno. El tráfico estaba loco.', 'Suena a que no te importa: mala idea con un profesor.', [N('That is not a great way to start. What happened?', 'Esa no es una buena forma de empezar. ¿Qué pasó?')])
      ]),
      Y('Explica que tu autobús se retrasó.', 'My bus was delayed this morning.', 'Mi autobús se retrasó esta mañana.'),
      N('I see. Please sit down. We are on page forty.', 'Entiendo. Siéntate, por favor. Estamos en la página cuarenta.'),
      Y('Pregunta si puedes conseguir los apuntes de la primera parte.', 'May I get the notes from the first part of the class?', '¿Puedo conseguir los apuntes de la primera parte de la clase?'),
      N('Ask your classmate Anna. She always takes good notes.', 'Pídeselos a tu compañera Anna. Siempre toma buenos apuntes.'),
      CH('Responde al profesor.', [
        O('great', 'Thank you, Professor. I will ask her right after class.', 'Gracias, profesor. Se los pediré justo después de clase.', 'Cortés y claro.', [N('Good. And please try to arrive on time next week.', 'Bien. Y por favor trata de llegar a tiempo la próxima semana.')]),
        O('ok', 'Okay, thanks.', 'Vale, gracias.', 'Aceptable, aunque algo seco con un profesor.', [N('Good. And please try to arrive on time next week.', 'Bien. Y por favor trata de llegar a tiempo la próxima semana.')]),
        O('off', 'Fine. I will ask her. It is no big deal.', 'Bien. Se los pediré. No es para tanto.', 'Suena despreocupado: muestra más respeto.', [N('It is a big deal for me. Please arrive on time next week.', 'Para mí sí es importante. Por favor llega a tiempo la próxima semana.')])
      ]),
      Y('Promete llegar a tiempo la próxima semana.', 'I promise I will be on time next week.', 'Prometo que llegaré a tiempo la próxima semana.')
    ] },

  { id: 'coldsoup', avatar: '🧑‍🍳', doodles: '🍝🍽️🍽️🔥💳', emoji: '🍝', title: 'La sopa llega fría', cat: 'travel', group: 'viaje', level: 2, partner: 'Camarero',
    blurb: 'Tu sopa está fría. Cómo lo digas cambia cómo te atienden.',
    turns: [
      N('Is everything all right with your meal?', '¿Todo está bien con su comida?'),
      CH('Dile que tu sopa está fría.', [
        O('great', 'Excuse me, my soup is cold. Could you heat it up, please?', 'Disculpe, mi sopa está fría. ¿Podría calentarla, por favor?', 'Cortés y claro: así consigues ayuda enseguida.', [N('I am so sorry! Of course. I will take it back right away.', '¡Lo siento mucho! Claro. Me la llevo enseguida.')]),
        O('ok', 'My soup is cold. Can you fix it?', 'Mi sopa está fría. ¿Puede arreglarlo?', 'Funciona, pero suena un poco seco.', [N('Sorry about that. I will take it back.', 'Disculpe. Me la llevo.')]),
        O('off', 'This soup is terrible! It is freezing!', '¡Esta sopa es horrible! ¡Está helada!', 'Muy agresivo: el camarero no tiene la culpa.', [N('I am sorry. I will bring you a new one.', 'Lo siento. Le traeré una nueva.')])
      ]),
      N('Here is your new soup. It is very hot. Is it better now?', 'Aquí tiene su sopa nueva. Está muy caliente. ¿Está mejor ahora?'),
      Y('Di que ahora está perfecta.', 'Yes, it is perfect now. Thank you.', 'Sí, ahora está perfecta. Gracias.'),
      N('Wonderful. Would you like some dessert?', 'Maravilloso. ¿Desean algo de postre?'),
      Y('Rechaza el postre y pide la cuenta.', 'No, thank you. Could we have the check, please?', 'No, gracias. ¿Nos trae la cuenta, por favor?'),
      N('Of course. Would you like to pay by card or in cash?', 'Claro. ¿Desean pagar con tarjeta o en efectivo?'),
      CH('Elige cómo pagar.', [
        O('great', 'By card, please.', 'Con tarjeta, por favor.', 'Corto y cortés: justo lo que se espera.', [N('Perfect. Here is the card machine.', 'Perfecto. Aquí está la terminal de pago.')]),
        O('ok', 'Card.', 'Tarjeta.', 'Se entiende, pero seco: añade «please».', [N('Sure. Here is the card machine.', 'Claro. Aquí está la terminal de pago.')]),
        O('off', 'Give me the card machine.', 'Dame la terminal de pago.', 'Suena a una orden: mejor «By card, please».', [N('Of course. Here you are.', 'Por supuesto. Aquí tiene.')])
      ]),
      Y('Agradece y deja el cambio de propina.', 'Thank you. Keep the change.', 'Gracias. Quédese con el cambio.')
    ] },

  { id: 'declineparty', avatar: '🧑‍💻', doodles: '🍰🎁🎁📅💬', emoji: '🍰', title: 'Rechazar una invitación', cat: 'social', group: 'social', level: 2, partner: 'Tu compañera Mia',
    blurb: 'Te invitan a una fiesta, pero no puedes ir.',
    turns: [
      N('Hi! I am having a birthday party on Saturday. Can you come?', '¡Hola! Voy a hacer una fiesta de cumpleaños el sábado. ¿Puedes venir?'),
      CH('Responde que no puedes ir.', [
        O('great', 'Thank you for inviting me! Unfortunately, I cannot make it.', '¡Gracias por invitarme! Por desgracia, no puedo ir.', 'Agradecer primero suaviza el rechazo.', [N('Oh, that is too bad! Do you have other plans?', '¡Qué pena! ¿Tienes otros planes?')]),
        O('ok', 'Sorry, I cannot come.', 'Lo siento, no puedo ir.', 'Claro, pero algo seco: agradece la invitación.', [N('Oh, okay. Do you have other plans?', 'Ah, vale. ¿Tienes otros planes?')]),
        O('off', 'No. I do not like parties.', 'No. No me gustan las fiestas.', 'Demasiado brusco: puede ofender aunque sea verdad.', [N('Oh... okay. Do you have other plans?', 'Ah... vale. ¿Tienes otros planes?')])
      ]),
      Y('Explica que tienes un examen el lunes.', 'Yes, I have an exam on Monday and I need to study.', 'Sí, tengo un examen el lunes y necesito estudiar.'),
      N('I understand. Good luck with it!', 'Lo entiendo. ¡Mucha suerte con eso!'),
      Y('Propón celebrar juntos otro día.', 'Can we celebrate together next week?', '¿Podemos celebrar juntos la próxima semana?'),
      N('Sure! That sounds great.', '¡Claro! Suena genial.'),
      CH('Desea un buen cumpleaños.', [
        O('great', 'Happy birthday! Have an amazing party.', '¡Feliz cumpleaños! Que tengas una fiesta increíble.', 'Cálido y amable: deja buen sabor.', [N('Thank you! That is so kind.', '¡Gracias! Qué amable.')]),
        O('ok', 'Okay, bye.', 'Vale, adiós.', 'Correcto, pero frío para una felicitación.', [N('Bye! Thanks anyway.', '¡Adiós! Gracias de todos modos.')])
      ]),
      Y('Despídete hasta la próxima semana.', 'See you next week!', '¡Nos vemos la próxima semana!')
    ] },

  { id: 'noisyneighbor', avatar: '🧑‍🔧', doodles: '🔊🎶🔑🌙🌙', emoji: '🔊', title: 'Pedirle a un vecino que baje la música', cat: 'social', group: 'social', level: 3, partner: 'Tu vecino Tom',
    blurb: 'La música está muy alta. Un buen tono evita el conflicto.',
    turns: [
      N('Hello! Can I help you?', '¡Hola! ¿Puedo ayudarte?'),
      CH('Dile que la música está muy alta.', [
        O('great', 'Hi, sorry to bother you. The music is a bit loud. Could you turn it down?', 'Hola, perdón por molestarte. La música está un poco alta. ¿Podrías bajarla?', 'Amable y claro: así se resuelven los problemas con vecinos.', [N('Oh, I am so sorry! I did not realize it was that loud.', '¡Lo siento mucho! No me di cuenta de que estaba tan alta.')]),
        O('ok', 'Your music is too loud. Please turn it down.', 'Tu música está muy alta. Por favor, bájala.', 'Directo pero educado: aceptable.', [N('Oh, sorry. I did not realize it was that loud.', 'Ah, perdón. No me di cuenta de que estaba tan alta.')]),
        O('off', 'Turn that noise off right now! I cannot sleep!', '¡Apaga ese ruido ahora mismo! ¡No puedo dormir!', 'Una orden agresiva suele empeorar el conflicto.', [N('Hey, calm down! I did not realize it was that loud.', '¡Oye, cálmate! No me di cuenta de que estaba tan alta.')])
      ]),
      Y('Explica que mañana tienes que trabajar temprano.', 'I have to wake up early for work tomorrow.', 'Tengo que despertarme temprano para trabajar mañana.'),
      N('I understand. I will turn it down now.', 'Entiendo. La bajaré ahora mismo.'),
      Y('Pide que la mantenga baja después de las diez.', 'Could you keep it quiet after ten at night?', '¿Podrías mantenerla baja después de las diez de la noche?'),
      N('Sure, no problem. Sorry again.', 'Claro, sin problema. Perdón otra vez.'),
      Y('Cierra con amabilidad.', 'Thank you for understanding. Good night!', 'Gracias por entenderlo. ¡Buenas noches!')
    ] },

  { id: 'meetclient', avatar: '🧑‍💼', doodles: '🤝💼☕📊📈', emoji: '🤝', title: 'Recibir a un cliente importante', cat: 'business', group: 'trabajo', level: 3, partner: 'Mr. Wilson (cliente)',
    blurb: 'Recibes a un cliente nuevo: el tono formal marca la diferencia.',
    turns: [
      N('Hello, I am Daniel Wilson. It is a pleasure to meet you.', 'Hola, soy Daniel Wilson. Es un placer conocerlo.'),
      CH('Preséntate.', [
        O('great', 'It is a pleasure to meet you too, Mr. Wilson. I work in the sales team.', 'Es un placer conocerlo también, señor Wilson. Trabajo en el equipo de ventas.', 'Formal y profesional: perfecto para un cliente.', [N('Wonderful. Thank you for having me.', 'Excelente. Gracias por recibirme.')]),
        O('ok', 'Nice to meet you! I work in sales.', '¡Mucho gusto! Trabajo en ventas.', 'Amable y válido, aunque menos formal.', [N('Great. Thank you for having me.', 'Genial. Gracias por recibirme.')]),
        O('off', 'Yo, what is up? I am in sales, bro.', 'Ey, ¿qué onda? Estoy en ventas, hermano.', 'Es jerga de amigos: evítala con clientes.', [N('Ah... nice to meet you. Thank you for having me.', 'Ah... un gusto. Gracias por recibirme.')])
      ]),
      Y('Ofrécele algo de beber.', 'Would you like some coffee or water?', '¿Le gustaría un café o agua?'),
      N('Water, please. Thank you.', 'Agua, por favor. Gracias.'),
      Y('Propón empezar con la presentación.', 'Shall we start with the presentation?', '¿Empezamos con la presentación?'),
      N('Yes, please. I am very interested in your proposal.', 'Sí, por favor. Me interesa mucho su propuesta.'),
      CH('Responde a su interés.', [
        O('great', 'I am glad to hear that. Let me show you the main points.', 'Me alegra oír eso. Permítame mostrarle los puntos principales.', 'Seguro y cortés.', [N('Please go ahead.', 'Adelante, por favor.')]),
        O('ok', 'Cool, I will show you the slides.', 'Genial, le mostraré las diapositivas.', 'Natural, pero más casual de lo ideal.', [N('Please go ahead.', 'Adelante, por favor.')])
      ]),
      Y('Después de presentar, pregunta si tiene dudas.', 'Do you have any questions so far?', '¿Tiene alguna pregunta hasta ahora?')
    ] }
];

// Grupos para filtrar la lista y niveles de dificultad (1 básico · 2 intermedio · 3 avanzado)
export const SCENE_GROUPS = [
  { id: 'all', label: 'Todas' }, { id: 'viaje', label: '✈️ Viaje' }, { id: 'diario', label: '🏠 Día a día' },
  { id: 'estudio', label: '🎓 Estudio' }, { id: 'trabajo', label: '💼 Trabajo' }, { id: 'social', label: '💬 Social' },
  { id: 'decisiones', label: '🔀 Decisiones' }
];
export const SCENE_LEVELS = { 1: 'Básico', 2: 'Intermedio', 3: 'Avanzado' };
