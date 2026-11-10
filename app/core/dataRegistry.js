// Vocabri — módulo "core/dataRegistry" (generado a partir de app.js)
import { getJsonCategoryMap, getCategoryShortLabel, getValidCategoryIds, getZonesMap, isValidCategory } from '../../categoriesRegistry.js';
import { S } from './shared.js';
import { MAX_CONSECUTIVE_NORMAL, etapaNameForSession } from '../mapData.js';
import { dayKey } from '../progress.js';
import { srsGrade, srsInvalidate } from '../state.js';

export const DATA = {
  "Casual": [
    // Saludos y Despedidas
    ["Hi! / Hello!","¡Hola!"],["Good morning.","Buenos días."],
    ["Good afternoon.","Buenas tardes."],["Good evening.","Buenas noches (al llegar)."],
    ["Good night.","Buenas noches (al despedirse)."],["How are you?","¿Cómo estás?"],
    ["How's it going?","¿Cómo te va?"],["I'm doing well, thanks.","Me va bien, gracias."],
    ["Not bad.","Nada mal."],["What's up?","¿Qué pasa? / ¿Qué tal?"],
    ["Nice to meet you.","Gusto en conocerte."],["Goodbye / Bye.","Adiós."],
    ["See you later.","Te veo luego."],["See you tomorrow.","Nos vemos mañana."],
    ["Take care.","Cuídate."],
    // Cortesía y Social
    ["Please.","Por favor."],["Thank you.","Gracias."],
    ["Thanks a lot.","Muchas gracias."],["You're welcome.","De nada."],
    ["No problem.","No hay problema."],["Excuse me.","Disculpe (para llamar la atención)."],
    ["Sorry.","Lo siento."],["I'm so sorry.","Lo siento mucho."],
    ["No worries.","No te preocupes."],["Don't worry about it.","No te preocupes por eso."],
    ["It's okay.","Está bien."],["After you.","Después de usted (pase usted)."],
    ["Cheers!","¡Salud! (al brindar) / Gracias (UK)."],["Of course.","Por supuesto."],
    ["Sure.","Claro."],["Maybe.","Tal vez."],
    ["I think so.","Creo que sí."],["I don't think so.","Creo que no."],
    ["I hope so.","Espero que sí."],["Exactly.","Exactamente."],
    // Para cuando no entiendes
    ["I don't understand.","No entiendo."],["I'm sorry, I didn't hear you.","Lo siento, no te escuché."],
    ["Can you repeat that?","¿Puedes repetir eso?"],["Could you speak slower?","¿Podrías hablar más lento?"],
    ["What did you say?","¿Qué dijiste?"],["How do you say [word] in English?","¿Cómo se dice [palabra] en inglés?"],
    ["What does this mean?","¿Qué significa esto?"],["How do you spell that?","¿Cómo se deletrea eso?"],
    ["Can you write it down?","¿Puedes escribirlo?"],["My English is not very good.","Mi inglés no es muy bueno."],
    ["I'm learning English.","Estoy aprendiendo inglés."],["I don't know.","No lo sé."],
    ["Do you speak Spanish?","¿Hablas español?"],["Just a moment.","Un momento."],
    ["One second, please.","Un segundo, por favor."],
    // Información Personal
    ["What's your name?","¿Cómo te llamas?"],["My name is...","Mi nombre es..."],
    ["Where are you from?","¿De dónde eres?"],["I am from [country].","Soy de [país]."],
    ["Where do you live?","¿Dónde vives?"],["I live in...","Vivo en..."],
    ["How old are you?","¿Cuántos años tienes?"],["What do you do?","¿A qué te dedicas?"],
    ["I'm a student.","Soy estudiante."],["I work at...","Trabajo en..."],
    ["What's your phone number?","¿Cuál es tu número de teléfono?"],["Are you on Instagram/Facebook?","¿Estás en Instagram/Facebook?"],
    ["What do you like to do?","¿Qué te gusta hacer?"],["I like...","Me gusta..."],
    ["I don't like...","No me gusta..."],["Are you married?","¿Estás casado/a?"],
    ["I'm single.","Estoy soltero/a."],["Do you have siblings?","¿Tienes hermanos?"],
    ["I have a dog.","Tengo un perro."],["I'm hungry.","Tengo hambre."],
    // Situaciones Diarias
    ["I'm thirsty.","Tengo sed."],["I'm tired.","Estoy cansado/a."],
    ["I'm bored.","Estoy aburrido/a."],["What time is it?","¿Qué hora es?"],
    ["Where is the bathroom?","¿Dónde está el baño?"],["How much is this?","¿Cuánto cuesta esto?"],
    ["I'm looking for...","Estoy buscando..."],["Can you help me?","¿Me puedes ayudar?"],
    ["I need help.","Necesito ayuda."],["I'm lost.","Estoy perdido/a."],
    ["Wait!","¡Espera!"],["Let's go.","Vámonos / Vamos."],
    ["Stop.","Detente / Para."],["Look.","Mira."],
    ["Listen.","Escucha."],["Hurry up!","¡Date prisa!"],
    ["I'm coming.","Ya voy."],["Never mind.","No importa / Olvídalo."],
    ["Sounds good.","Suena bien."],["Are you sure?","¿Estás seguro/a?"],
    ["I'm sure.","Estoy seguro/a."],["I'm not sure.","No estoy seguro/a."],
    ["Good job!","¡Buen trabajo!"],["Well done.","Bien hecho."],
    ["Don't give up.","No te rindas."],["Keep it up.","Sigue así."],
    ["I have a question.","Tengo una pregunta."],["I forgot.","Se me olvidó."],
    ["I remember.","Recuerdo."],["Have a nice day!","¡Que tengas un buen día!"],
    // Viajes y Transporte
    ["Where is the airport?","¿Dónde está el aeropuerto?"],["I'd like a ticket to...","Me gustaría un boleto para..."],
    ["One-way or round trip?","¿Solo ida o ida y vuelta?"],["What time does the train leave?","¿A qué hora sale el tren?"],
    ["Is this seat taken?","¿Está ocupado este asiento?"],["Where is the bus station?","¿Dónde está la estación de autobuses?"],
    ["Does this bus go to the city center?","¿Este bus va al centro?"],["Please tell me where to get off.","Por favor, dime dónde bajarme."],
    ["I need a taxi.","Necesito un taxi."],["To this address, please.","A esta dirección, por favor."],
    ["How much is the fare?","¿Cuánto es la tarifa?"],["Keep the change.","Quédese con el cambio."],
    ["Is it far from here?","¿Está lejos de aquí?"],["Is it within walking distance?","¿Se puede llegar caminando?"],
    ["I have a reservation.","Tengo una reservación."],["What time is check-in?","¿A qué hora es el ingreso (al hotel)?"],
    ["I'd like to check out.","Me gustaría dejar la habitación."],["Where is the elevator?","¿Dónde está el ascensor?"],
    ["Can I leave my luggage here?","¿Puedo dejar mi equipaje aquí?"],["Is there Wi-Fi here?","¿Hay Wi-Fi aquí?"],
    ["What is the password?","¿Cuál es la contraseña?"],["The air conditioning doesn't work.","El aire acondicionado no funciona."],
    ["Can I have an extra towel?","¿Me puede dar una toalla extra?"],["Where can I rent a car?","¿Dónde puedo rentar un auto?"],
    ["I'm here on vacation.","Estoy aquí de vacaciones."],
    // En el Restaurante
    ["A table for two, please.","Una mesa para dos, por favor."],["Can I see the menu?","¿Puedo ver el menú?"],
    ["Are you ready to order?","¿Están listos para ordenar?"],["What do you recommend?","¿Qué recomienda?"],
    ["What is the soup of the day?","¿Cuál es la sopa del día?"],["I'll have the same.","Comeré lo mismo."],
    ["I'm allergic to...","Soy alérgico/a a..."],["Does this have meat?","¿Esto tiene carne?"],
    ["I'm a vegetarian.","Soy vegetariano/a."],["Water, please.","Agua, por favor."],
    ["Sparkling or still?","¿Con gas o sin gas?"],["Without ice.","Sin hielo."],
    ["Enjoy your meal!","¡Buen provecho!"],["This is delicious.","Esto está delicioso."],
    ["This is cold.","Esto está frío."],["It's too spicy.","Está demasiado picante."],
    ["Can I have some salt?","¿Me da un poco de sal?"],["Anything else?","¿Algo más?"],
    ["Nothing else, thanks.","Nada más, gracias."],["The check, please.","La cuenta, por favor."],
    ["Can I pay by card?","¿Puedo pagar con tarjeta?"],["Do you take cash?","¿Aceptan efectivo?"],
    ["Is service included?","¿La propina está incluida?"],["Separate checks, please.","Cuentas separadas, por favor."],
    ["To go, please.","Para llevar, por favor."],["I'd like a coffee.","Quisiera un café."],
    ["With sugar/milk.","Con azúcar/leche."],["Can I have a refill, please?","¿Me puede rellenar, por favor?"],
    ["I'm full.","Estoy lleno/satisfecho."],["Where are the restrooms?","¿Dónde están los baños?"],
    // De Compras
    ["I'm just looking.","Solo estoy mirando."],["How much does this cost?","¿Cuánto cuesta esto?"],
    ["Do you have this in blue?","¿Tiene esto en azul?"],["Do you have a smaller size?","¿Tiene una talla más pequeña?"],
    ["Do you have a larger size?","¿Tiene una talla más grande?"],["Where is the fitting room?","¿Dónde está el probador?"],
    ["It doesn't fit me.","No me queda bien."],["It's too expensive.","Es muy caro."],
    ["Is there a discount?","¿Hay algún descuento?"],["I'll take it.","Me lo llevo."],
    ["Where is the cashier?","¿Dónde está el cajero?"],["Can I have a receipt?","¿Me da un recibo?"],
    ["Can I have a bag?","¿Me da una bolsa?"],["I'd like to return this.","Me gustaría devolver esto."],
    ["Do you have a warranty?","¿Tienen garantía?"],["Where is the pharmacy?","¿Dónde está la farmacia?"],
    ["I need some aspirin.","Necesito aspirinas."],["Where is the supermarket?","¿Dónde está el supermercado?"],
    ["Can I pay with this?","¿Puedo pagar con esto?"],["Are you open on Sundays?","¿Abren los domingos?"],
    ["What time do you close?","¿A qué hora cierran?"],["What time do you open?","¿A qué hora abren?"],
    ["Sold out.","Agotado."],["Buy one get one free.","Compra uno y llévate otro gratis."],
    ["On sale.","En oferta."],
    // Direcciones
    ["Excuse me, I'm lost.","Disculpe, estoy perdido/a."],["Can you show me on the map?","¿Puede mostrármelo en el mapa?"],
    ["Turn left.","Gire a la izquierda."],["Turn right.","Gire a la derecha."],
    ["Go straight ahead.","Siga todo recto."],["Go past the park.","Pase el parque."],
    ["On the corner.","En la esquina."],["At the traffic light.","En el semáforo."],
    ["Behind the building.","Detrás del edificio."],["In front of the bank.","Frente al banco."],
    ["Next to the museum.","Al lado del museo."],["Across from the library.","Frente a la biblioteca (cruzando)."],
    ["Keep going for two blocks.","Siga por dos cuadras."],["You can't miss it.","No tiene pérdida."],
    ["It's on the left.","Está a la izquierda."],["It's on the right.","Está a la derecha."],
    ["Is there a bank nearby?","¿Hay un banco cerca?"],["How do I get to...?","¿Cómo llego a...?"],
    ["Is it this way?","¿Es por aquí?"],["Thank you for your help!","¡Gracias por su ayuda!"],
    // El Tiempo y la Hora
    ["What's the weather like?","¿Cómo está el clima?"],["It's sunny.","Está soleado."],
    ["It's raining.","Está lloviendo."],["It's freezing.","Está helando."],
    ["It's very hot today.","Hace mucho calor hoy."],["It's cloudy.","Está nublado."],
    ["It looks like rain.","Parece que va a llover."],["It's windy.","Hace viento."],
    ["What time shall we meet?","¿A qué hora nos vemos?"],["I'll be there in ten minutes.","Estaré allí en diez minutos."],
    ["You're early.","Llegaste temprano."],["I'm late.","Llego tarde."],
    ["Sorry for being late.","Perdón por la demora."],["Is it too late?","¿Es muy tarde?"],
    ["It's about time!","¡Ya era hora!"],
    // En el Trabajo
    ["How is work going?","¿Cómo va el trabajo?"],["I'm very busy today.","Estoy muy ocupado hoy."],
    ["Can you help me with this?","¿Puedes ayudarme con esto?"],["I have a meeting at 3 PM.","Tengo una reunión a las 3 PM."],
    ["Let's schedule a call.","Programemos una llamada."],["I'll send you an email.","Te enviaré un correo electrónico."],
    ["Did you get my message?","¿Recibiste mi mensaje?"],["I'm working on it.","Estoy trabajando en ello."],
    ["When is the deadline?","¿Cuándo es la fecha límite?"],["I'm on my lunch break.","Estoy en mi hora de almuerzo."],
    ["I'll be back in an hour.","Volveré en una hora."],["Could you sign here?","¿Podría firmar aquí?"],
    ["Who is in charge here?","¿Quién está a cargo aquí?"],["I need a day off.","Necesito un día libre."],
    ["He's in a meeting.","Él está en una reunión."],["The printer is broken.","La impresora está rota."],
    ["I'm out of the office.","Estoy fuera de la oficina."],["Can we talk in private?","¿Podemos hablar en privado?"],
    ["Good luck!","¡Buena suerte!"],["Well done on the project.","Bien hecho con el proyecto."],
    ["I agree with you.","Estoy de acuerdo contigo."],["I disagree.","No estoy de acuerdo."],
    ["That's a good point.","Ese es un buen punto."],["Let's take a break.","Tomemos un descanso."],
    ["I'm finished.","He terminado."],["What do you do for a living?","¿En qué trabajas?"],
    ["I'm looking for a job.","Estoy buscando trabajo."],["I'm self-employed.","Trabajo por cuenta propia."],
    ["I've been promoted.","Me han ascendido."],["It's a deal.","Trato hecho."],
    // Teléfono y Tecnología
    ["Hello, this is [name] speaking.","Hola, habla [nombre]."],["Who is calling?","¿Quién llama?"],
    ["Can I speak to [name]?","¿Puedo hablar con [nombre]?"],["Hold on a moment, please.","Espere un momento, por favor."],
    ["The line is busy.","La línea está ocupada."],["I can't hear you very well.","No te escucho muy bien."],
    ["You're breaking up.","Se está cortando."],["I'll call you back.","Te llamo de vuelta."],
    ["My battery is low.","Mi batería está baja."],["I have no signal.","No tengo señal."],
    ["Can I borrow your charger?","¿Me prestas tu cargador?"],["I'll text you.","Te enviaré un mensaje de texto."],
    ["Send me the link.","Envíame el enlace."],["Is there a computer I can use?","¿Hay alguna computadora que pueda usar?"],
    ["I forgot my password.","Olvidé mi contraseña."],["The internet is slow.","El internet está lento."],
    ["Can you download this?","¿Puedes descargar esto?"],["It's not working.","No está funcionando."],
    ["Turn it on.","Enciéndelo."],["Turn it off.","Apágalo."],
    ["Turn up the volume.","Sube el volumen."],["Turn down the volume.","Baja el volumen."],
    ["Press the button.","Presiona el botón."],["Save the file.","Guarda el archivo."],
    ["Check your email.","Revisa tu correo."],
    // Salud y Emergencias
    ["How do you feel?","¿Cómo te sientes?"],["I don't feel well.","No me siento bien."],
    ["I feel sick.","Me siento enfermo/a."],["I have a headache.","Tengo dolor de cabeza."],
    ["I have a cold.","Tengo un resfriado."],["I have a fever.","Tengo fiebre."],
    ["I have a cough.","Tengo tos."],["My throat hurts.","Me duele la garganta."],
    ["I need to see a doctor.","Necesito ver a un médico."],["Call an ambulance!","¡Llamen a una ambulancia!"],
    ["It's an emergency.","Es una emergencia."],["Are you hurt?","¿Estás herido?"],
    ["Where does it hurt?","¿Dónde te duele?"],["I have a stomach ache.","Tengo dolor de estómago."],
    ["I'm dizzy.","Estoy mareado/a."],["I need some medicine.","Necesito algo de medicina."],
    ["Take a deep breath.","Respira profundo."],["I need to rest.","Necesito descansar."],
    ["Get well soon!","¡Que te mejores pronto!"],["Bless you!","¡Salud! (al estornudar)"],
    ["Help!","¡Ayuda!"],["Call the police!","¡Llamen a la policía!"],
    ["I've been robbed.","Me han robado."],["I lost my wallet.","Perdí mi billetera."],
    ["I lost my passport.","Perdí mi pasaporte."],["Watch out!","¡Cuidado!"],
    ["Be careful.","Ten cuidado."],["Fire!","¡Fuego!"],
    ["Is everyone okay?","¿Están todos bien?"],["Everything is going to be fine.","Todo va a estar bien."],
    // Sentimientos y Estados de Ánimo
    ["I'm happy.","Estoy feliz."],["I'm sad.","Estoy triste."],
    ["I'm excited!","¡Estoy emocionado/a!"],["I'm nervous.","Estoy nervioso/a."],
    ["I'm angry.","Estoy enojado/a."],["I'm worried.","Estoy preocupado/a."],
    ["I'm surprised.","Estoy sorprendido/a."],["I'm embarrassed.","Estoy avergonzado/a."],
    ["I'm shy.","Soy tímido/a."],["I'm confused.","Estoy confundido/a."],
    ["I'm proud of you.","Estoy orgulloso/a de ti."],["I'm scared.","Tengo miedo."],
    ["I feel lonely.","Me siento solo/a."],["I'm exhausted.","Estoy agotado/a."],
    ["I'm annoyed.","Estoy molesto/a."],["I'm calm.","Estoy tranquilo/a."],
    ["I'm jealous.","Tengo celos."],["Don't be upset.","No te disgustes."],
    ["Cheer up!","¡Anímate!"],["Calm down.","Cálmate."],
    ["Are you okay?","¿Estás bien?"],["What's wrong?","¿Qué pasa?"],
    ["Is everything alright?","¿Está todo bien?"],["I'm in a good mood.","Estoy de buen humor."],
    ["I'm in a bad mood.","Estoy de mal humor."],
    // Expresando Opiniones y Gustos
    ["I think that...","Pienso que..."],["In my opinion...","En mi opinión..."],
    ["I believe so.","Creo que sí."],["I don't mind.","No me importa."],
    ["It doesn't matter.","No importa."],["It's up to you.","Depende de ti."],
    ["I don't care.","No me importa."],["That's true.","Eso es verdad."],
    ["That's not true.","Eso no es verdad."],["I love it.","Me encanta."],
    ["I hate it.","Lo odio."],["It's interesting.","Es interesante."],
    ["It's boring.","Es aburrido."],["It's amazing!","¡Es increíble!"],
    ["It's awful.","Es horrible."],["I prefer...","Prefiero..."],
    ["I'd rather...","Preferiría..."],["It's worth it.","Vale la pena."],
    ["It's a waste of time.","Es una pérdida de tiempo."],["What's your favorite...?","¿Cuál es tu... favorito/a?"],
    ["I'm interested in...","Me interesa..."],["I'm not interested.","No me interesa."],
    ["That's a great idea!","¡Esa es una gran idea!"],["I'm not sure about that.","No estoy seguro de eso."],
    ["You're right.","Tienes razón."],["You're wrong.","Estás equivocado/a."],
    ["I agree completely.","Estoy totalmente de acuerdo."],["That makes sense.","Eso tiene sentido."],
    ["It depends.","Depende."],["I guess so.","Supongo que sí."],
    // Describiendo Personas
    ["He is tall.","Él es alto."],["She is short.","Ella es baja."],
    ["They are friendly.","Ellos son amigables."],["He is very kind.","Él es muy amable."],
    ["She is beautiful.","Ella es hermosa."],["He is handsome.","Él es guapo."],
    ["They are funny.","Ellos son divertidos."],["He is serious.","Él es serio."],
    ["She is smart.","Ella es inteligente."],["He is hardworking.","Él es trabajador."],
    ["She is lazy.","Ella es perezosa."],["He is quiet.","Él es callado."],
    ["She is outgoing.","Ella es extrovertida."],["He is young.","Él es joven."],
    ["They are old.","Ellos son viejos."],["What does he look like?","¿Cómo es él físicamente?"],
    ["What is she like?","¿Cómo es ella (personalidad)?"],["He has brown eyes.","Él tiene ojos cafés."],
    ["She has long hair.","Ella tiene el cabello largo."],["He wears glasses.","Él usa lentes."],
    // Relaciones y Vida Social
    ["Who is that?","¿Quién es ese/a?"],["He is my friend.","Él es mi amigo."],
    ["She is my coworker.","Ella es mi compañera de trabajo."],["They are my neighbors.","Ellos son mis vecinos."],
    ["Do you have a boyfriend/girlfriend?","¿Tienes novio/novia?"],["We are just friends.","Solo somos amigos."],
    ["I'm here with my family.","Estoy aquí con mi familia."],["How do you know him?","¿Cómo lo conoces?"],
    ["We went to school together.","Fuimos a la escuela juntos."],["I've known her for years.","La conozco hace años."],
    ["Would you like to go out?","¿Te gustaría salir?"],["Let's hang out.","Vamos a pasar el rato."],
    ["Are you free tonight?","¿Estás libre esta noche?"],["I have plans.","Tengo planes."],
    ["I'm busy.","Estoy ocupado/a."],["Can I bring a friend?","¿Puedo llevar a un amigo?"],
    ["Nice to see you again.","Qué bueno verte de nuevo."],["Keep in touch.","Mantente en contacto."],
    ["Call me sometime.","Llámame en algún momento."],["Give me your number.","Dame tu número."],
    ["It was nice talking to you.","Fue un gusto hablar contigo."],["I had a great time.","La pasé muy bien."],
    ["Tell him I said hello.","Dile que le mando saludos."],["I'll see you soon.","Te veré pronto."],
    ["Take it easy.","Tómatelo con calma."],
    // En Casa
    ["I'm home!","¡Ya estoy en casa!"],["Where are my keys?","¿Dónde están mis llaves?"],
    ["Can you open the window?","¿Puedes abrir la ventana?"],["Close the door, please.","Cierra la puerta, por favor."],
    ["Is the heater on?","¿Está encendida la calefacción?"],["Turn off the lights.","Apaga las luces."],
    ["I need to charge my phone.","Necesito cargar mi teléfono."],["Where is the remote control?","¿Dónde está el control remoto?"],
    ["The Wi-Fi is down.","El Wi-Fi no funciona."],["I'm going to take a shower.","Voy a tomar una ducha."],
    ["Where is the towel?","¿Dónde está la toalla?"],["I'm going to bed.","Me voy a la cama."],
    ["Did you lock the door?","¿Cerraste la puerta con llave?"],["I need to wake up at 7 AM.","Necesito despertarme a las 7 AM."],
    ["Set the alarm.","Pon la alarma."],["I slept like a log.","Dormí como un tronco."],
    ["I couldn't sleep.","No pude dormir."],["The house is a mess.","La casa es un desastre."],
    ["I'm looking for my glasses.","Estoy buscando mis lentes."],["Can you help me clean up?","¿Me ayudas a limpiar?"],
    ["Make your bed.","Haz tu cama."],["I'll be in my room.","Estaré en mi cuarto."],
    ["Is there any mail for me?","¿Hay correo para mí?"],["The trash is full.","La basura está llena."],
    ["I need to do laundry.","Necesito lavar la ropa."],
    // En la Cocina y Comida
    ["What's for dinner?","¿Qué hay de cena?"],["I'm cooking tonight.","Yo cocino esta noche."],
    ["Can you set the table?","¿Puedes poner la mesa?"],["I'm hungry as a wolf.","Tengo un hambre de lobo."],
    ["Is it ready yet?","¿Ya está listo?"],["Be careful, it's hot.","Ten cuidado, está caliente."],
    ["Pass me the salt, please.","Pásame la sal, por favor."],["This smells good.","Esto huele bien."],
    ["Wash your hands.","Lávate las manos."],["I'll wash the dishes.","Yo lavaré los platos."],
    ["Do we have any milk?","¿Tenemos leche?"],["We are out of eggs.","Se nos acabaron los huevos."],
    ["I need to go grocery shopping.","Necesito ir a comprar víveres."],["Put it in the fridge.","Ponlo en el refrigerador."],
    ["Help yourself.","Sírvete tú mismo."],["Would you like some more?","¿Te gustaría un poco más?"],
    ["I'm full, thank you.","Estoy satisfecho, gracias."],["It tastes delicious.","Sabe delicioso."],
    ["It's too salty.","Está demasiado salado."],["It's too sweet.","Está demasiado dulce."],
    ["Can I have a glass of water?","¿Me das un vaso de agua?"],["Heat it up in the microwave.","Caliéntalo en el microondas."],
    ["Where are the forks?","¿Dónde están los tenedores?"],["Clean the counter.","Limpia el mostrador."],
    ["Do you want tea or coffee?","¿Quieres té o café?"],["I'll have a snack.","Tomaré un bocadillo."],
    ["The water is boiling.","El agua está hirviendo."],["Slice the bread.","Rebana el pan."],
    ["It's my favorite dish.","Es mi plato favorito."],["Let's eat out.","Comamos fuera."],
    // Hobbies y Tiempo Libre
    ["What do you do for fun?","¿Qué haces para divertirte?"],["I like listening to music.","Me gusta escuchar música."],
    ["Do you play any instruments?","¿Tocas algún instrumento?"],["I play the guitar.","Toco la guitarra."],
    ["I enjoy reading books.","Disfruto leer libros."],["What kind of movies do you like?","¿Qué tipo de películas te gustan?"],
    ["I love watching series.","Me encanta ver series."],["Let's go to the cinema.","Vamos al cine."],
    ["I'm a big fan of...","Soy un gran fan de..."],["Do you like sports?","¿Te gustan los deportes?"],
    ["I go to the gym every day.","Voy al gimnasio todos los días."],["I like to go for a run.","Me gusta salir a correr."],
    ["Do you play video games?","¿Juegas videojuegos?"],["I love traveling.","Me encanta viajar."],
    ["I'm learning to paint.","Estoy aprendiendo a pintar."],["I like photography.","Me gusta la fotografía."],
    ["What's your hobby?","¿Cuál es tu pasatiempo?"],["I'm interested in history.","Me interesa la historia."],
    ["Let's go for a walk.","Vamos a caminar."],["I'm just relaxing.","Solo estoy descansando."],
    ["Do you want to play cards?","¿Quieres jugar a las cartas?"],["I enjoy gardening.","Disfruto la jardinería."],
    ["I'm bored, let's do something.","Estoy aburrido, hagamos algo."],["That's very entertaining.","Eso es muy entretenido."],
    ["I'm not into sports.","No me interesan los deportes."],
    // Preguntas Frecuentes y Misceláneas
    ["What's happening?","¿Qué está pasando?"],["What's the matter?","¿Cuál es el problema?"],
    ["Is there anything else?","¿Hay algo más?"],["Are you ready?","¿Estás listo?"],
    ["I'm almost ready.","Casi estoy listo."],["Wait for me.","Espérame."],
    ["I'm in a hurry.","Tengo prisa."],["Take your time.","Tómate tu tiempo."],
    ["It's a secret.","Es un secreto."],["Don't tell anyone.","No se lo digas a nadie."],
    ["Can I trust you?","¿Puedo confiar en ti?"],["I promise.","Lo prometo."],
    ["I'm serious.","Hablo en serio."],["Are you joking?","¿Estás bromeando?"],
    ["It's just a joke.","Es solo una broma."],["I don't care at all.","No me importa en lo más mínimo."],
    ["That's enough.","Eso es suficiente."],["It's too much.","Es demasiado."],
    ["Believe me.","Créeme."],["Trust me.","Confía en mí."],
    // Dinero y Finanzas
    ["I need to withdraw some money.","Necesito retirar algo de dinero."],["Where is the nearest ATM?","¿Dónde está el cajero automático más cercano?"],
    ["Can I exchange money here?","¿Puedo cambiar dinero aquí?"],["What is the exchange rate?","¿Cuál es el tipo de cambio?"],
    ["I'm broke.","No tengo dinero."],["It's a bit pricey.","Es un poco costoso."],
    ["That's a bargain!","¡Eso es una ganga!"],["Can I pay in installments?","¿Puedo pagar en cuotas?"],
    ["I'd like to open a bank account.","Me gustaría abrir una cuenta bancaria."],["I lost my credit card.","Perdí mi tarjeta de crédito."],
    ["My card was declined.","Mi tarjeta fue rechazada."],["What is my balance?","¿Cuál es mi saldo?"],
    ["Is there a fee?","¿Hay alguna comisión?"],["I need a loan.","Necesito un préstamo."],
    ["I'm saving money for...","Estoy ahorrando dinero para..."],["It's expensive to live here.","Es caro vivir aquí."],
    ["I'll pay for it.","Yo lo pagaré."],["Let's split the bill.","Dividamos la cuenta."],
    ["It's on me.","Yo invito."],["How much do I owe you?","¿Cuánto te debo?"],
    ["You owe me five dollars.","Me debes cinco dólares."],["I'll pay you back tomorrow.","Te pagaré mañana."],
    ["Keep your receipt.","Guarda tu recibo."],["Is it tax-free?","¿Es libre de impuestos?"],
    ["I can't afford it.","No puedo permitírmelo."],
    // Planes y Futuro
    ["What are you doing this weekend?","¿Qué harás este fin de semana?"],["I'm going to...","Voy a..."],
    ["I'm planning to...","Planeo..."],["I'll think about it.","Lo pensaré."],
    ["I'll let you know.","Te aviso."],["Are you going to be free?","¿Vas a estar libre?"],
    ["It depends on the weather.","Depende del clima."],["I might go.","Puede que vaya."],
    ["I'm looking forward to it.","Lo espero con ansias."],["We should do that.","Deberíamos hacer eso."],
    ["When will it be ready?","¿Cuándo estará listo?"],["It won't take long.","No tomará mucho tiempo."],
    ["Wait and see.","Espera y verás."],["That's not going to happen.","Eso no va a pasar."],
    ["I'll be right back.","Regreso enseguida."],["Don't be late.","No llegues tarde."],
    ["I'll meet you there.","Te veré allá."],["What time does it start?","¿A qué hora empieza?"],
    ["What time does it end?","¿A qué hora termina?"],["Are you coming with me?","¿Vienes conmigo?"],
    ["I'm not sure yet.","No estoy seguro aún."],["I'll try my best.","Haré lo mejor que pueda."],
    ["That would be great.","Eso sería genial."],["Maybe another time.","Quizás en otra ocasión."],
    ["Count me in.","Cuenta conmigo."],
    // Hablando del Pasado
    ["How was your day?","¿Cómo estuvo tu día?"],["It was great.","Estuvo genial."],
    ["I was very busy.","Estuve muy ocupado/a."],["What did you do yesterday?","¿Qué hiciste ayer?"],
    ["I went to the park.","Fui al parque."],["I saw a movie.","Vi una película."],
    ["I didn't do much.","No hice mucho."],["Did you have fun?","¿Te divertiste?"],
    ["I had a wonderful time.","Pasé un tiempo maravilloso."],["Where were you?","¿Dónde estabas?"],
    ["I was at home.","Estaba en casa."],["I've already done it.","Ya lo he hecho."],
    ["I haven't seen him today.","No lo he visto hoy."],["It has been a long day.","Ha sido un día largo."],
    ["I used to live there.","Yo solía vivir allí."],["I forgot what I said.","Olvidé lo que dije."],
    ["That was a mistake.","Eso fue un error."],["I didn't mean to do that.","No fue mi intención hacer eso."],
    ["How did it happen?","¿Cómo pasó?"],["I was born in...","Nací en..."],
    ["I grew up in...","Crecí en..."],["I studied [career].","Estudié [carrera]."],
    ["It was a long time ago.","Fue hace mucho tiempo."],["I just got here.","Acabo de llegar."],
    ["I've heard about that.","He oído hablar de eso."],
    // Trámites y Documentos
    ["Can I see your ID?","¿Puedo ver su identificación?"],["I need to fill out this form.","Necesito llenar este formulario."],
    ["What is your occupation?","¿Cuál es su ocupación?"],["Sign at the bottom.","Firme al final."],
    ["I need a copy of this.","Necesito una copia de esto."],["Where is the post office?","¿Dónde está la oficina de correos?"],
    ["I want to send this letter.","Quiero enviar esta carta."],["How many stamps do I need?","¿Cuántas estampillas necesito?"],
    ["It's very important.","Es muy importante."],["I'm looking for the embassy.","Estoy buscando la embajada."],
    ["Is this information correct?","¿Es correcta esta información?"],["I need a witness.","Necesito un testigo."],
    ["Do I need a visa?","¿Necesito una visa?"],["My passport expires soon.","Mi pasaporte vence pronto."],
    ["Can you print this for me?","¿Puede imprimir esto para mí?"],["Where can I park?","¿Dónde puedo estacionar?"],
    ["Is parking free?","¿El estacionamiento es gratis?"],["I have a permit.","Tengo un permiso."],
    ["The office is closed.","La oficina está cerrada."],["Come back tomorrow.","Vuelva mañana."],
    ["Wait in line, please.","Espere en la fila, por favor."],["It's your turn.","Es tu turno."],
    ["Whose turn is it?","¿De quién es el turno?"],["I have an appointment.","Tengo una cita."],
    ["Thank you for your patience.","Gracias por su paciencia."],
    // Phrasal Verbs y Expresiones Comunes
    ["Hold on a second.","Espera un segundo."],["Go on, I'm listening.","Continúa, te escucho."],
    ["I need to find out.","Necesito averiguar."],["Let's figure it out.","Vamos a resolverlo."],
    ["I'll look into it.","Lo investigaré."],["Slow down, please.","Ve más despacio, por favor."],
    ["Don't rush me.","No me apresures."],["Come in.","Adelante."],
    ["Sit down.","Siéntate."],["Stand up.","Levántate."],
    ["Turn it up.","Súbelo."],["Turn it down.","Bájalo."],
    ["Put it on.","Póntelo."],["Take it off.","Quítatelo."],
    ["I'm looking for my keys.","Estoy buscando mis llaves."],["Look out!","¡Cuidado!"],
    ["Pick it up.","Recógelo."],["Put it away.","Guárdalo."],
    ["I get along with him.","Me llevo bien con él."],["We ran out of coffee.","Se nos acabó el café."],
    ["I'll figure it out.","Lo resolveré."],["Keep on trying.","Sigue intentándolo."],
    ["Show me.","Muéstrame."],["Let me know.","Avísame."],
    ["Think it over.","Piénsalo bien."],
    // Discusiones y Malentendidos
    ["What do you mean?","¿Qué quieres decir?"],["I didn't mean to offend you.","No quise ofenderte."],
    ["It was a misunderstanding.","Fue un malentendido."],["Don't get me wrong.","No me malinterpretes."],
    ["Let's talk about it.","Hablemos de ello."],["Listen to me.","Escúchame."],
    ["That's not what I said.","Eso no fue lo que dije."],["Can you explain that?","¿Puedes explicar eso?"],
    ["I'm sorry, I forgot.","Lo siento, lo olvidé."],["It's my fault.","Es mi culpa."],
    ["It's not your fault.","No es tu culpa."],["Don't be mad at me.","No te enojes conmigo."],
    ["Let's forget about it.","Olvidémoslo."],["I apologize.","Pido disculpas."],
    ["I forgive you.","Te perdono."],["Stop arguing.","Dejen de discutir."],
    ["We need to find a solution.","Necesitamos encontrar una solución."],["It's not a big deal.","No es para tanto."],
    ["Are you kidding me?","¿Me estás tomando el pelo?"],["I mean it.","Lo digo en serio."],
    ["Believe it or not.","Créalo o no."],["To be honest...","Para ser honesto..."],
    ["Anyway...","De todos modos..."],["As I was saying...","Como iba diciendo..."],
    ["In other words...","En otras palabras..."],
    // Expresando Certeza y Duda
    ["I'm sure about it.","Estoy seguro de eso."],["I'm not so sure.","No estoy tan seguro."],
    ["I have no doubt.","No tengo ninguna duda."],["It's possible.","Es posible."],
    ["It's impossible.","Es imposible."],["Most likely.","Lo más probable."],
    ["I doubt it.","Lo dudo."],["Maybe you're right.","Quizás tengas razón."],
    ["Definitely.","Definitivamente."],["Absolutely.","Absolutamente."],
    ["No way!","¡De ninguna manera!"],["Of course not.","Por supuesto que no."],
    ["I suppose so.","Supongo que sí."],["That sounds plausible.","Eso suena creíble."],
    ["It depends on...","Depende de..."],["Who knows?","¿Quién sabe?"],
    ["It's hard to say.","Es difícil de decir."],["I can't tell.","No sabría decirte."],
    ["Are you certain?","¿Estás cierto/seguro?"],["There is a chance.","Hay una posibilidad."],
    ["I bet you.","Te apuesto."],["As far as I know.","Hasta donde yo sé."],
    ["Unless...","A menos que..."],["Provided that...","Siempre y cuando..."],
    ["Regardless of that.","Independientemente de eso."],
    // Deseos y Necesidades
    ["I want...","Yo quiero..."],["I need...","Yo necesito..."],
    ["I would like...","Me gustaría..."],["I wish...","Desearía..."],
    ["I hope everything goes well.","Espero que todo salga bien."],["I'm dying for a coffee.","Me muero por un café."],
    ["I could use some help.","Me vendría bien algo de ayuda."],["If only I could...","Si tan solo pudiera..."],
    ["What do you want to do?","¿Qué quieres hacer?"],["I'm in the mood for something sweet.","Se me antoja algo dulce."],
    ["I'm craving pizza.","Tengo antojo de pizza."],["Do you need anything?","¿Necesitas algo?"],
    ["It's necessary.","Es necesario."],["It's optional.","Es opcional."],
    ["I have to go.","Tengo que irme."],["I must do it.","Debo hacerlo."],
    ["I'd better go.","Mejor me voy."],["Should I wait?","¿Debería esperar?"],
    ["You ought to try it.","Deberías probarlo."],["May I?","¿Puedo?"],
    ["Can I have a look?","¿Puedo echar un vistazo?"],["I don't want to bother you.","No quiero molestarte."],
    ["If you don't mind.","Si no te importa."],["It's urgent.","Es urgente."],
    ["Take care of yourself.","Cuídate mucho."],
    // Comparaciones y Cantidades
    ["It's better than I thought.","Es mejor de lo que pensaba."],["It's worse than before.","Es peor que antes."],
    ["The more, the better.","Cuanto más, mejor."],["It's the same thing.","Es lo mismo."],
    ["It's different from this.","Es diferente a esto."],["It's not as good as...","No es tan bueno como..."],
    ["It's much bigger.","Es mucho más grande."],["It's smaller than that.","Es más pequeño que eso."],
    ["This one is cheaper.","Este es más barato."],["That's the most expensive.","Ese es el más caro."],
    ["I need more of this.","Necesito más de esto."],["That's more than enough.","Eso es más que suficiente."],
    ["It's too much for me.","Es demasiado para mí."],["There are too many people.","Hay demasiada gente."],
    ["A little bit more.","Un poquito más."],["Not even a little.","Ni siquiera un poco."],
    ["Most of the time.","La mayoría de las veces."],["Hardly ever.","Casi nunca."],
    ["At least once.","Al menos una vez."],["Is there any left?","¿Queda algo?"],
    ["There's none left.","No queda nada."],["It's half price.","Está a mitad de precio."],
    ["Double check it.","Revísalo dos veces."],["In total.","En total."],
    ["Approximately.","Aproximadamente."],
    // Eventos y Celebraciones
    ["Happy Birthday!","¡Feliz cumpleaños!"],["Congratulations!","¡Felicidades!"],
    ["Merry Christmas!","¡Feliz Navidad!"],["Happy New Year!","¡Feliz Año Nuevo!"],
    ["Best wishes.","Mis mejores deseos."],["Good luck with that.","Buena suerte con eso."],
    ["I'm invited to a party.","Estoy invitado a una fiesta."],["Who else is coming?","¿Quién más vendrá?"],
    ["What should I wear?","¿Qué debería ponerme?"],["It's a formal event.","Es un evento formal."],
    ["Feel at home.","Siéntete como en casa."],["Thanks for inviting me.","Gracias por invitarme."],
    ["The party was great.","La fiesta estuvo genial."],["Let's have a drink.","Vamos a tomar algo."],
    ["I'm having a great time.","La estoy pasando muy bien."],["Would you like to dance?","¿Te gustaría bailar?"],
    ["It's time to celebrate.","Es hora de celebrar."],["Let's make a toast.","Hagamos un brindis."],
    ["To your health!","¡A tu salud!"],["It was a surprise.","Fue una sorpresa."],
    ["When is the wedding?","¿Cuándo es la boda?"],["I'm so happy for you.","Estoy muy feliz por ti."],
    ["That's wonderful news.","Esa es una noticia maravillosa."],["Keep up the good work.","Sigue con el buen trabajo."],
    ["Have fun!","¡Diviértete!"],
    // Describiendo Experiencias
    ["It was an accident.","Fue un accidente."],["I've never seen that.","Nunca he visto eso."],
    ["It happens all the time.","Pasa todo el tiempo."],["It was a coincidence.","Fue una coincidencia."],
    ["I had a dream about you.","Tuve un sueño contigo."],["It's a long story.","Es una larga historia."],
    ["I've changed my mind.","He cambiado de opinión."],["That reminds me...","Eso me recuerda..."],
    ["I don't remember exactly.","No recuerdo exactamente."],["I have a feeling that...","Tengo el presentimiento de que..."],
    ["It's hard to believe.","Es difícil de creer."],["That was embarrassing.","Eso fue vergonzoso."],
    ["It was scary.","Fue aterrador."],["I'm so relieved.","Estoy tan aliviado/a."],
    ["It's a nightmare.","Es una pesadilla."],["Everything went wrong.","Todo salió mal."],
    ["It went better than expected.","Salió mejor de lo esperado."],["I learned my lesson.","Aprendí mi lección."],
    ["It's a dream come true.","Es un sueño hecho realidad."],["I'm used to it.","Estoy acostumbrado/a a ello."],
    ["I'll never forget it.","Nunca lo olvidaré."],["What a relief!","¡Qué alivio!"],
    ["It's a small world.","El mundo es un pañuelo."],["In the end...","Al final..."],
    ["It was unforgettable.","Fue inolvidable."],
    // Frases para la Calle y el Entorno
    ["Is it safe around here?","¿Es seguro por aquí?"],["It's very crowded.","Está muy lleno de gente."],
    ["I'm looking for a park.","Estoy buscando un parque."],["Where can I find a map?","¿Dónde puedo encontrar un mapa?"],
    ["The street is blocked.","La calle está bloqueada."],["Follow me.","Sígueme."],
    ["Let's cross the street.","Crucemos la calle."],["Be careful with the traffic.","Ten cuidado con el tráfico."],
    ["It's just around the corner.","Está justo a la vuelta de la esquina."],["I need to buy a ticket.","Necesito comprar un boleto."],
    ["Where is the entrance?","¿Dónde está la entrada?"],["Where is the exit?","¿Dónde está la salida?"],
    ["Is it open to the public?","¿Está abierto al público?"],["There's a long queue.","Hay una larga fila."],
    ["Can I take a photo?","¿Puedo tomar una foto?"],["No smoking allowed.","No se permite fumar."],
    ["No entry.","Prohibida la entrada."],["Watch your step.","Tenga cuidado donde pisa."],
    ["Keep off the grass.","No pise el césped."],["It's a quiet neighborhood.","Es un vecindario tranquilo."],
    ["I love the atmosphere here.","Me encanta el ambiente aquí."],["The view is amazing.","La vista es increíble."],
    ["It's worth a visit.","Vale la pena visitarlo."],["I'm just passing through.","Solo estoy de paso."],
    ["What a beautiful place!","¡Qué lugar tan hermoso!"],
    // Modismos y Expresiones Idiomáticas
    ["Break a leg!","¡Buena suerte!"],["It's a piece of cake.","Es pan comido."],
    ["Under the weather.","Sentirse un poco enfermo o decaído."],["Call it a day.","Dar el día por terminado."],
    ["Better late than never.","Más vale tarde que nunca."],["Once in a blue moon.","Muy de vez en cuando."],
    ["The best of both worlds.","Lo mejor de dos mundos."],["Don't beat around the bush.","No te andes con rodeos."],
    ["Cut to the chase.","Ir al grano."],["Hit the nail on the head.","Diste en el clavo."],
    ["Keep an eye on...","Vigila..."],["Make a long story short.","Para resumir."],
    ["Miss the boat.","Perder la oportunidad."],["No pain, no gain.","Sin esfuerzo no hay recompensa."],
    ["On the ball.","Estar alerta."],["Pull someone's leg.","Tomarle el pelo a alguien."],
    ["So far, so good.","Hasta ahora, todo bien."],["Speak of the devil.","Hablando del rey de Roma."],
    ["The last straw.","La gota que colmó el vaso."],["Through thick and thin.","En las buenas y en las malas."],
    ["Your guess is as good as mine.","No tengo idea."],["Break the ice.","Romper el hielo."],
    ["Cost an arm and a leg.","Costar un ojo de la cara."],["Let the cat out of the bag.","Revelar un secreto sin querer."],
    ["Piece of mind.","Tranquilidad."],["Barking up the wrong tree.","Buscar en el lugar equivocado."],
    ["Back to the drawing board.","Volver a empezar de cero."],["In the heat of the moment.","En el fragor del momento."],
    ["Wrap your head around something.","Entender algo complejo."],["Spill the beans.","Contar un secreto."],
    // Educación y Aprendizaje
    ["I'm taking a course.","Estoy haciendo un curso."],["I need to study.","Necesito estudiar."],
    ["Can you explain this again?","¿Puedes explicar esto de nuevo?"],["I'm preparing for an exam.","Me estoy preparando para un examen."],
    ["I passed the test!","¡Pasé el examen!"],["I failed the exam.","Reprobé el examen."],
    ["It's a difficult subject.","Es una materia difícil."],["I'm doing my homework.","Estoy haciendo mi tarea."],
    ["Where is the library?","¿Dónde está la biblioteca?"],["I need to borrow a book.","Necesito pedir prestado un libro."],
    ["What's the answer?","¿Cuál es la respuesta?"],["I major in...","Mi especialidad universitaria es..."],
    ["I graduated last year.","Me gradué el año pasado."],["Learn by heart.","Aprender de memoria."],
    ["Could you give me some feedback?","¿Podrías darme tu retroalimentación?"],["Practice makes perfect.","La práctica hace al maestro."],
    ["I made a mistake.","Cometí un error."],["Please correct me if I'm wrong.","Por favor, corrígeme si me equivoco."],
    ["I'm getting better.","Estoy mejorando."],["Take notes.","Toma notas."],
    ["Turn in your assignment.","Entrega tu tarea."],["What's the meaning of this word?","¿Cuál es el significado de esta palabra?"],
    ["Look it up in the dictionary.","Búscalo en el diccionario."],["Pay attention.","Presta atención."],
    ["I'm self-taught.","Soy autodidacta."],
    // Motivación y Ánimo
    ["You can do it!","¡Tú puedes hacerlo!"],["Keep going!","¡Sigue adelante!"],
    ["Never give up on your dreams.","Nunca renuncies a tus sueños."],["Believe in yourself.","Cree en ti mismo."],
    ["Anything is possible.","Todo es posible."],["Stay positive.","Mantente positivo."],
    ["Dream big.","Sueña en grande."],["It's never too late.","Nunca es demasiado tarde."],
    ["Go for it!","¡Ve por ello!"],["Take a chance.","Arriésgate."],
    ["Everything will be okay.","Todo estará bien."],["One step at a time.","Un paso a la vez."],
    ["Don't be afraid of mistakes.","No tengas miedo a los errores."],["Success takes time.","El éxito toma tiempo."],
    ["Focus on your goals.","Enfócate en tus metas."],["You're doing great.","Lo estás haciendo genial."],
    ["You should be proud of yourself.","Deberías estar orgulloso de ti mismo."],["That's the spirit!","¡Esa es la actitud!"],
    ["Make it happen.","Haz que suceda."],["Just do it.","Solo hazlo."],
    ["You have potential.","Tienes potencial."],["Stay focused.","Mantente enfocado."],
    ["Hard work pays off.","El trabajo duro rinde frutos."],["Be yourself.","Sé tú mismo."],
    ["Never lose hope.","Nunca pierdas la esperanza."],
    // Preguntas para Profundizar
    ["What do you mean by that?","¿Qué quieres decir con eso?"],["How does that work?","¿Cómo funciona eso?"],
    ["Why do you think so?","¿Por qué piensas eso?"],["What's the reason?","¿Cuál es la razón?"],
    ["Could you be more specific?","¿Podrías ser más específico?"],["What's your point?","¿Cuál es tu punto?"],
    ["How do you feel about this?","¿Qué piensas sobre esto?"],["What are the pros and cons?","¿Cuáles son los pros y los contras?"],
    ["Is there any difference?","¿Hay alguna diferencia?"],["Can you give me an example?","¿Puedes darme un ejemplo?"],
    ["What are the options?","¿Cuáles son las opciones?"],["How long does it take?","¿Cuánto tiempo toma?"],
    ["What's the catch?","¿Cuál es la trampa?"],["Are you for real?","¿Hablas en serio?"],
    ["What's the worst that could happen?","¿Qué es lo peor que podría pasar?"],["Does that make sense to you?","¿Tiene sentido eso para ti?"],
    ["Can you imagine that?","¿Puedes imaginar eso?"],["What if...?","¿Qué tal si...?"],
    ["Is it worth it?","¿Vale la pena?"],["What's next?","¿Qué sigue?"],
    // Proverbios y Sabiduría Popular
    ["Actions speak louder than words.","Las acciones hablan más que las palabras."],["Better safe than sorry.","Más vale prevenir que lamentar."],
    ["Don't judge a book by its cover.","No juzgues un libro por su portada."],["Every cloud has a silver lining.","No hay mal que por bien no venga."],
    ["Knowledge is power.","El conocimiento es poder."],["Time is money.","El tiempo es dinero."],
    ["Where there's a will, there's a way.","Querer es poder."],["Birds of a feather flock together.","Dios los cría y ellos se juntan."],
    ["Good things come to those who wait.","Lo bueno le llega a quien sabe esperar."],["The early bird catches the worm.","Al que madruga, Dios lo ayuda."],
    ["Easy come, easy go.","Lo que fácil viene, fácil se va."],["Honesty is the best policy.","La honestidad es la mejor política."],
    ["Practice what you preach.","Predica con el ejemplo."],["Rome wasn't built in a day.","Roma no se construyó en un día."],
    ["A watched pot never boils.","Olla vigilada nunca hierve."],["Beauty is in the eye of the beholder.","La belleza está en los ojos del que mira."],
    ["A friend in need is a friend indeed.","En las malas se conocen a los amigos."],["Keep your friends close and your enemies closer.","Ten cerca a tus amigos, pero más cerca a tus enemigos."],
    ["Don't put all your eggs in one basket.","No te lo juegues todo a una sola carta."],["Fortune favors the bold.","La fortuna favorece a los valientes."],
    ["Out of sight, out of mind.","Ojos que no ven, corazón que no siente."],["The grass is always greener on the other side.","El césped siempre es más verde al otro lado."],
    ["All's well that ends well.","Bien está lo que bien acaba."],["When in Rome, do as the Romans do.","Donde fueres, haz lo que vieres."],
    ["You can't have your cake and eat it too.","No se puede tener todo en la vida."],
    // Frases Avanzadas para Debatir
    ["On the other hand...","Por otro lado..."],["Having said that...","Dicho esto..."],
    ["Taking everything into account.","Teniendo todo en cuenta."],["In the long run.","A largo plazo."],
    ["In the short term.","A corto plazo."],["Actually...","De hecho..."],
    ["Supposedly...","Supuestamente..."],["Essentially...","Esencialmente..."],
    ["In terms of...","En términos de..."],["The bottom line is...","El punto clave es..."],
    ["Broadly speaking.","En términos generales."],["To some extent.","Hasta cierto punto."],
    ["It's a win-win situation.","Es una situación en la que todos ganan."],["That's out of the question.","Eso está fuera de discusión."],
    ["Let's agree to disagree.","Aceptemos que no estamos de acuerdo."],["From my point of view.","Desde mi punto de vista."],
    ["I'm inclined to think that...","Me inclino a pensar que..."],["Let's look at the big picture.","Veamos el panorama general."],
    ["It's a double-edged sword.","Es un arma de doble filo."],["For the time being.","Por el momento."],
    ["In light of recent events.","A la luz de los hechos recientes."],["That's easier said than done.","Eso es más fácil decirlo que hacerlo."],
    ["It goes without saying.","Sobra decir que..."],["Regardless of the outcome.","Independientemente del resultado."],
    ["At the end of the day.","Al fin y al cabo."],
    // Expresiones para Situaciones Específicas
    ["Long story short.","Resumiendo."],["I'll keep that in mind.","Lo tendré en cuenta."],
    ["You've outdone yourself.","Te has superado a ti mismo."],["Don't take it personally.","No te lo tomes personal."],
    ["I'm at your disposal.","Estoy a tu disposición."],["It's a matter of time.","Es cuestión de tiempo."],
    ["I'm in your debt.","Estoy en deuda contigo."],["Don't jump to conclusions.","No saques conclusiones precipitadas."],
    ["Let's get down to business.","Vayamos al grano."],["I'm all ears.","Soy todo oídos."],
    ["It's not worth the trouble.","No vale la pena la molestia."],["I'll sleep on it.","Lo consultaré con la almohada."],
    ["Just for the record.","Para que conste."],["Don't push your luck.","No tientes a la suerte."],
    ["It's a small price to pay.","Es un precio pequeño que pagar."],["I'm under a lot of pressure.","Estoy bajo mucha presión."],
    ["You're on the right track.","Vas por buen camino."],["It was a spur-of-the-moment decision.","Fue una decisión de último momento."],
    ["I have mixed feelings about it.","Tengo sentimientos encontrados al respecto."],["Don't hold your breath.","No te hagas ilusiones."],
    ["That's a relief.","Eso es un alivio."],["What a small world!","¡Qué mundo tan pequeño!"],
    ["It's high time.","Ya va siendo hora."],["In the blink of an eye.","En un abrir y cerrar de ojos."],
    ["The sky is the limit.","El cielo es el límite."],
    // Despedidas y Cierre Final
    ["It's been a pleasure.","Ha sido un placer."],["I must be going.","Debo irme."],
    ["Don't be a stranger.","No te pierdas."],["I've had a wonderful time.","Me lo he pasado de maravilla."],
    ["I'll catch you later.","Te veo luego."],["Have a safe trip.","Ten un viaje seguro."],
    ["Say hello to your family.","Saluda a tu familia de mi parte."],["Thanks for everything.","Gracias por todo."],
    ["I really enjoyed our talk.","Realmente disfruté nuestra charla."],["Let's do this again soon.","Hagamos esto de nuevo pronto."],
    ["I'm looking forward to seeing you again.","Espero volver a verte pronto."],["Take care and stay in touch.","Cuídate y mantente en contacto."],
    ["It was nice meeting you.","Fue un gusto conocerte."],["I wish you all the best.","Te deseo todo lo mejor."],
    ["Good luck with your project.","Buena suerte con tu proyecto."],["Until next time.","Hasta la próxima."],
    ["Peace out.","Adiós (informal)."],["I'm off.","Me voy."],
    ["Keep me posted.","Manténme informado."],["It's time to say goodbye.","Es hora de decir adiós."],
    ["Hope to see you soon.","Espero verte pronto."],["God bless you.","Dios te bendiga."],
    ["It was great seeing you.","Fue un gusto verte."],["You made my day.","Me alegraste el día."],
    ["We finally did it!","¡Finalmente lo logramos!"]
  ],
  "Universidad": [
    ["Could you repeat that, please?","¿Podrías repetir eso, por favor?","","Cuando no escuchaste bien al profesor."],["I have a question.","Tengo una pregunta.","","Para interrumpir educadamente en clase."],
    ["Can you explain that again?","¿Puedes explicar eso otra vez?","","Si no entendiste una explicación."],["I didn't catch that.","No entendí eso.","","Cuando te perdiste una palabra o idea."],
    ["Does this count toward the final grade?","¿Esto cuenta para la nota final?","","Al preguntar sobre una tarea o examen."],["When is this due?","¿Cuándo es la fecha de entrega?","","Para confirmar la fecha de entrega."],
    ["I need an extension.","Necesito una prórroga/extensión.","","Al pedirle más tiempo al profesor."],["I'm working on my assignment.","Estoy trabajando en mi tarea.","","Cuando alguien pregunta en qué andas."],
    ["Can we work in groups?","¿Podemos trabajar en grupos?","","Al proponer trabajo en equipo."],["I submitted it online.","Lo envié en línea.","","Para confirmar que ya entregaste algo."],
    ["I'm studying for my exam.","Estoy estudiando para mi examen.","","Explicando por qué estás ocupado/a."],["What will the test cover?","¿Qué abarcará el examen?","","Antes de un examen importante."],
    ["I failed/passed the exam.","Reprobé/aprobé el examen.","","Al contar el resultado de un examen."],["Is it open-book?","¿Es con libro abierto?","","Preguntando las reglas de un examen."],
    ["I need to review my notes.","Necesito repasar mis apuntes.","","Antes de estudiar para un examen."],["Can I schedule office hours?","¿Puedo agendar una cita en horario de oficina?","","Para hablar en privado con un profesor."],
    ["I'd like some feedback on this.","Me gustaría recibir retroalimentación sobre esto.","","Al pedir opinión sobre un trabajo."],["Would you mind if I asked you something?","¿Te molestaría si te pregunto algo?","","Para pedir permiso antes de preguntar."],
    ["Let's study together.","Estudiemos juntos.","","Al proponer estudiar con un compañero."],["I'm behind on the reading.","Estoy atrasado/a en la lectura.","","Explicando que te atrasaste con la lectura."],
    ["I'm majoring in...","Mi carrera es...","","Al presentarte y decir tu carrera."],["I have a scholarship.","Tengo una beca.","","Hablando de cómo pagas tus estudios."],
    ["My schedule is packed this semester.","Mi horario está muy cargado este semestre.","","Explicando que tienes poco tiempo libre."],["I need to register for classes.","Necesito inscribirme a las clases.","","Antes de que empiece el semestre."],
    ["I'm on the waiting list.","Estoy en la lista de espera.","","Cuando una clase ya no tiene cupo."],
    ["I need to drop this class.","Necesito dar de baja esta clase.","","Al decidir dejar una materia."],["What's the deadline for the paper?","¿Cuál es la fecha límite del ensayo?","","Preguntando por un ensayo o trabajo."],
    ["I have a group project.","Tengo un proyecto grupal.","","Hablando de tus tareas pendientes."],["Can I get an extension on the essay?","¿Puedo tener una prórroga para el ensayo?","","Pidiendo más tiempo para un ensayo."],
    ["I'm taking five classes this semester.","Estoy tomando cinco clases este semestre.","","Hablando de tu carga académica."],["The lecture was really helpful.","La clase magistral fue muy útil.","","Comentando sobre una clase que tomaste."],
    ["I need to cite my sources.","Necesito citar mis fuentes.","","Al hablar de normas de un ensayo."],["Where's the library located?","¿Dónde está ubicada la biblioteca?","","Preguntando direcciones en el campus."],
    ["I have to write a research paper.","Tengo que escribir un trabajo de investigación.","","Explicando una tarea pendiente grande."],["My advisor helped me choose my classes.","Mi asesor me ayudó a elegir mis clases.","","Hablando de tu asesor académico."]
  ],
  "Programación": [
    ["I'm writing a function.","Estoy escribiendo una función.","","Explicando en qué parte del código estás."],["This variable stores the value.","Esta variable almacena el valor.","","Explicando cómo funciona tu código."],
    ["Let me refactor this code.","Déjame refactorizar este código.","","Antes de mejorar código existente."],["The code is not working.","El código no está funcionando.","","Cuando algo falla y no sabes por qué."],
    ["I need to comment out this line.","Necesito comentar esta línea.","","Al depurar código temporalmente."],["I'm getting an error.","Me está dando un error.","","Explicando un problema técnico."],
    ["It's throwing an exception.","Está lanzando una excepción.","","Describiendo un error específico en la app."],["Let me set a breakpoint.","Déjame poner un punto de interrupción.","","Al empezar a depurar código."],
    ["I found the bug.","Encontré el error/bug.","","Después de resolver un problema difícil."],["It works on my machine.","Funciona en mi máquina.","","Broma común entre programadores."],
    ["I need to push my changes.","Necesito subir mis cambios (push).","","Al terminar de programar por hoy."],["Can you review my pull request?","¿Puedes revisar mi pull request?","","Pidiendo revisión de código a un compañero."],
    ["There's a merge conflict.","Hay un conflicto de fusión.","","Al combinar dos ramas de código."],["Let's pull the latest version.","Traigamos la última versión (pull).","","Antes de seguir trabajando en equipo."],
    ["I'll create a new branch.","Voy a crear una nueva rama.","","Al empezar una nueva función."],["Let's sync up on this.","Sincronicémonos sobre esto.","","Proponiendo una reunión breve de trabajo."],
    ["What's the status of the project?","¿Cuál es el estado del proyecto?","","Preguntando avances a tu equipo."],["I'll share my screen.","Voy a compartir mi pantalla.","","Al empezar una videollamada de trabajo."],
    ["We need to scope this out.","Necesitamos definir el alcance de esto.","","Planeando una nueva funcionalidad."],["Can you walk me through it?","¿Puedes explicarme paso a paso?","","Pidiendo que te expliquen paso a paso."],
    ["I'm deploying the app.","Estoy desplegando la aplicación.","","Al subir una app a producción."],["The server is down.","El servidor está caído.","","Reportando una falla técnica."],
    ["We need to run the tests.","Necesitamos correr las pruebas.","","Antes de publicar un cambio."],["Let's update the dependencies.","Actualicemos las dependencias.","","Al dar mantenimiento a un proyecto."],
    ["The database is out of sync.","La base de datos está desincronizada.","","Explicando un problema de datos."],
    ["Let's write some unit tests.","Escribamos algunas pruebas unitarias.","","Proponiendo mejorar la calidad del código."],["I'm optimizing the algorithm.","Estoy optimizando el algoritmo.","","Explicando que mejoras el rendimiento."],
    ["The API returned an error.","La API devolvió un error.","","Reportando un fallo al consumir un servicio."],["Let's containerize this app.","Contenericemos esta aplicación.","","Proponiendo usar contenedores en un proyecto."],
    ["I need to install the dependencies.","Necesito instalar las dependencias.","","Antes de correr un proyecto nuevo."],["The build failed.","La compilación falló.","","Reportando un error al compilar."],
    ["Let's add some logging.","Agreguemos registros (logs).","","Proponiendo mejorar el monitoreo del sistema."],["I'm reading the documentation.","Estoy leyendo la documentación.","","Explicando cómo estás aprendiendo algo nuevo."],
    ["This function is deprecated.","Esta función está obsoleta.","","Advirtiendo sobre código antiguo."],["Let's automate this process.","Automaticemos este proceso.","","Proponiendo ahorrar trabajo manual repetitivo."]
  ],
  "Espacio": [
    ["Outer space","El espacio exterior","Outer space begins about 100 kilometers above sea level.","Hablando del lugar más allá de la atmósfera."],
    ["The solar system","El sistema solar","The solar system has eight planets orbiting the sun.","Al describir el sol y sus planetas."],
    ["A planet / a moon","Un planeta / una luna","Jupiter is a planet, and Europa is one of its moons.","Explicando la diferencia entre estos cuerpos."],
    ["A star / a galaxy","Una estrella / una galaxia","Our sun is a star inside the Milky Way galaxy.","Hablando de astronomía en general."],
    ["The universe is vast.","El universo es vasto.","","Reflexionando sobre el tamaño del cosmos."],["The rocket launched successfully.","El cohete se lanzó exitosamente.","","Dando una noticia sobre una misión."],
    ["They landed on the moon.","Aterrizaron en la luna.","","Hablando de un logro histórico."],["The astronaut is on a mission.","El astronauta está en una misión.","","Describiendo el trabajo de un astronauta."],
    ["The spacecraft entered orbit.","La nave espacial entró en órbita.","","Narrando el avance de una misión."],["Mission control confirmed the landing.","El control de misión confirmó el aterrizaje.","","Reportando el éxito de un aterrizaje."],
    ["Scientists discovered a new exoplanet.","Los científicos descubrieron un nuevo exoplaneta.","","Compartiendo una noticia científica."],["Let's look through the telescope.","Miremos a través del telescopio.","","Invitando a observar el cielo."],
    ["The stars are shining tonight.","Las estrellas brillan esta noche.","","Comentando sobre una noche despejada."],["Gravity keeps the planets in orbit.","La gravedad mantiene a los planetas en órbita.","","Explicando un concepto de física."],
    ["That's a shooting star!","¡Esa es una estrella fugaz!","","Al señalar algo en el cielo nocturno."],["Do you think there's life out there?","¿Crees que hay vida allá afuera?","","Iniciando una conversación filosófica."],
    ["How far is that planet from Earth?","¿Qué tan lejos está ese planeta de la Tierra?","","Preguntando sobre distancias espaciales."],["It's fascinating how big the universe is.","Es fascinante lo grande que es el universo.","","Expresando asombro por el cosmos."],
    ["I'd love to travel to space someday.","Me encantaría viajar al espacio algún día.","","Hablando de un sueño personal."],["That documentary about space was amazing.","Ese documental sobre el espacio fue increíble.","","Recomendando algo que viste."],
    ["NASA announced a new mission.","La NASA anunció una nueva misión.","","Compartiendo noticias de la NASA."],["There's a meteor shower tonight.","Hay una lluvia de meteoros esta noche.","","Avisando sobre un evento astronómico."],
    ["The eclipse will happen next week.","El eclipse ocurrirá la próxima semana.","","Anunciando un evento astronómico próximo."],["They're building a new space station.","Están construyendo una nueva estación espacial.","","Hablando de proyectos espaciales actuales."],
    ["The satellite is orbiting Earth.","El satélite está orbitando la Tierra.","","Explicando cómo funciona un satélite."],
    ["The rover is exploring the surface.","El róver está explorando la superficie.","","Hablando de una misión a Marte."],["Black holes bend light.","Los agujeros negros curvan la luz.","","Explicando un dato curioso de física."],
    ["The moon has phases.","La luna tiene fases.","","Hablando del ciclo lunar."],["Astronomers study the night sky.","Los astrónomos estudian el cielo nocturno.","","Describiendo la labor de un astrónomo."],
    ["The rocket reached escape velocity.","El cohete alcanzó la velocidad de escape.","","Explicando cómo un cohete sale de la Tierra."],["Space is a vacuum.","El espacio es un vacío.","","Compartiendo un dato científico básico."],
    ["The crew returned safely.","La tripulación regresó a salvo.","","Dando buenas noticias tras una misión."],["That comet is visible tonight.","Ese cometa es visible esta noche.","","Avisando sobre un evento en el cielo."],
    ["Mars has two small moons.","Marte tiene dos lunas pequeñas.","","Compartiendo un dato curioso sobre Marte."],["The probe sent back images.","La sonda envió imágenes de vuelta.","","Hablando de resultados de una misión."]
  ],
  "Inmobiliaria": [
    ["I'm looking for an apartment to rent.","Estoy buscando un departamento para rentar.","","Al iniciar la búsqueda de vivienda."],["Is this unit still available?","¿Esta unidad sigue disponible?","","Preguntando por un anuncio de renta."],
    ["Can I schedule a viewing?","¿Puedo agendar una visita?","","Pidiendo visitar una propiedad."],["What's included in the rent?","¿Qué está incluido en la renta?","","Antes de firmar un contrato."],
    ["Is it furnished or unfurnished?","¿Está amueblado o sin amueblar?","","Preguntando sobre los muebles del lugar."],["I'd like to sign the lease.","Me gustaría firmar el contrato de arrendamiento.","","Al aceptar rentar un lugar."],
    ["How much is the security deposit?","¿Cuánto es el depósito de garantía?","","Preguntando por los costos iniciales."],["What's the length of the lease?","¿Cuál es la duración del contrato?","","Aclarando la duración del contrato."],
    ["Are pets allowed?","¿Se permiten mascotas?","","Si tienes una mascota."],["I need a co-signer/guarantor.","Necesito un aval/fiador.","","Hablando de los requisitos para rentar."],
    ["When is the rent due?","¿Cuándo se vence la renta?","","Preguntando la fecha límite de pago."],["Is utilities included?","¿Los servicios están incluidos?","","Preguntando por agua, luz o gas."],
    ["I'd like to set up automatic payments.","Me gustaría configurar pagos automáticos.","","Organizando tus pagos mensuales."],["There's a late fee if I miss the deadline.","Hay un cargo por retraso si me paso de la fecha.","","Advirtiendo sobre pagos atrasados."],
    ["Can you send me the invoice?","¿Puedes enviarme la factura?","","Pidiendo un comprobante de pago."],["Something is broken in the apartment.","Algo está roto en el departamento.","","Reportando un desperfecto en casa."],
    ["Can you send a maintenance request?","¿Puedes enviar una solicitud de mantenimiento?","","Pidiendo una reparación al arrendador."],["The heater/AC isn't working.","La calefacción/el aire acondicionado no funciona.","","Reportando un problema con el clima interior."],
    ["There's a leak in the bathroom.","Hay una fuga en el baño.","","Reportando un problema de plomería."],["I need to report this to the landlord.","Necesito reportar esto al arrendador.","","Avisando de un problema al dueño."],
    ["I'm moving out next month.","Me voy a mudar el próximo mes.","","Anunciando que dejarás el lugar."],["I need to give my notice.","Necesito dar mi aviso de terminación.","","Antes de terminar un contrato de renta."],
    ["Will I get my deposit back?","¿Me devolverán mi depósito?","","Preguntando sobre el fin del contrato."],["Can we do a final walkthrough?","¿Podemos hacer una inspección final?","","Antes de entregar las llaves."],
    ["I'd like to renew my lease.","Me gustaría renovar mi contrato.","","Al querer quedarte más tiempo."],
    ["The listing includes photos.","El anuncio incluye fotos.","","Describiendo un anuncio de renta."],["I want to negotiate the price.","Quiero negociar el precio.","","Al intentar bajar el precio."],
    ["The property manager handles repairs.","El administrador de la propiedad se encarga de las reparaciones.","","Explicando quién resuelve los problemas."],["Is parking included?","¿El estacionamiento está incluido?","","Preguntando por un espacio de auto."],
    ["I need proof of income.","Necesito comprobante de ingresos.","","Hablando de los documentos requeridos."],["The neighborhood is quiet.","El vecindario es tranquilo.","","Describiendo el entorno de un lugar."],
    ["We signed a month-to-month lease.","Firmamos un contrato mes a mes.","","Explicando el tipo de contrato."],["The rent increased this year.","La renta subió este año.","","Comentando sobre el costo de vida."],
    ["I'm subletting my apartment.","Estoy subarrendando mi departamento.","","Explicando un arreglo temporal de renta."],["The building has a doorman.","El edificio tiene portero.","","Describiendo los servicios del edificio."]
  ]
};



export const realCats = Object.keys(DATA);


export const CAT_MODULE_SIZES = {'Casual': [15,20,15,20,30,25,30,25,20,15,30,25,30,25,30,20,25,25,30,25,20,25,25,25,25,25,25,25,25,25,25,25,25,30,25,25,20,25,25,25,25]};


export const CAT_MODULE_NAMES = {'Casual': ["Saludos y Despedidas","Cortesía y Social","Para cuando no entiendes","Información Personal","Situaciones Diarias","Viajes y Transporte","En el Restaurante","De Compras","Direcciones","El Tiempo y la Hora","En el Trabajo","Teléfono y Tecnología","Salud y Emergencias","Sentimientos y Estados de Ánimo","Expresando Opiniones y Gustos","Describiendo Personas","Relaciones y Vida Social","En Casa","En la Cocina y Comida","Hobbies y Tiempo Libre","Preguntas Frecuentes y Misceláneas","Dinero y Finanzas","Planes y Futuro","Hablando del Pasado","Trámites y Documentos","Phrasal Verbs y Expresiones Comunes","Discusiones y Malentendidos","Expresando Certeza y Duda","Deseos y Necesidades","Comparaciones y Cantidades","Eventos y Celebraciones","Describiendo Experiencias","Frases para la Calle y el Entorno","Modismos y Expresiones Idiomáticas","Educación y Aprendizaje","Motivación y Ánimo","Preguntas para Profundizar","Proverbios y Sabiduría Popular","Frases Avanzadas para Debatir","Expresiones para Situaciones Específicas","Despedidas y Cierre Final"]};


// Categorías del JSON: 4 zonas temáticas. Los tamaños son múltiplos de 8 (una sección = 8 frases), así las secciones y los
// exámenes quedan exactamente donde estaban antes de nombrar las zonas (el progreso guardado no se desplaza).
export const JSON_ZONES = getZonesMap();


export const ZONES_CARRY_EXAM = new Set(Object.keys(JSON_ZONES));


export function hasNamedModules(cat){
  if(!CAT_MODULE_SIZES[cat]) return false;
  // Zonas del JSON: solo si encajan con las frases cargadas (si no, mapa sin zonas, como antes)
  if(ZONES_CARRY_EXAM.has(cat)) return CAT_MODULE_SIZES[cat].reduce((a,b)=>a+b,0) === (DATA[cat] ? DATA[cat].length : -1);
  return true;
}


// Categorías maestras (las únicas con contenido de la app) + etiquetas propias del usuario.
// 'Casual', 'Universidad', 'Espacio' e 'Inmobiliaria' son datos heredados: ya no se listan (general = Casual).
export const MASTER_IDS = getValidCategoryIds();


export function allCats(){
  const m = MASTER_IDS.filter(c=> DATA[c] && DATA[c].length);
  return m.concat(S.customCats.filter(c=> MASTER_IDS.indexOf(c)<0 && c !== 'Casual'));
}


// Nombre legible de una categoría (maestra → etiqueta corta; el resto, tal cual)
export function catLabel(c){
  return isValidCategory(c) ? getCategoryShortLabel(c) : (c === 'Casual' ? 'General' : c);
}



// --- Stage / lesson system (Duolingo-style) ---



export function getUnlockedStage(cat){ return S.unlockedStage[cat] || 0; }


export function setUnlockedStage(cat, idx){
  S.unlockedStage[cat] = idx;
  try{ localStorage.setItem('vocabri_unlocked_stage', JSON.stringify(S.unlockedStage)); }catch(e){}
}


// --- Cool-down mechanic (memory-consolidation pacing) ---
export const COOLDOWN_NORMAL_MS = 14400000;

 // 4 hours after 2 consecutive normal Secciones
export const COOLDOWN_EXAM_MS = 28800000;

   // 8 hours after 1 Sección de Examen (1 estrella)
export const COOLDOWN_EXAM_BY_STARS = {1:28800000, 2:21600000, 3:14400000};

   // mejor nota → descanso más corto (8 h · 6 h · 4 h)
export function defaultVocabriProgress(){
  return {categoriaActualId:'', etapaActualId:'', seccionActualId:'',
          seccionesCompletadasSeguidas:0, ultimoTimestamp:0, enCooldown:false, tiempoCooldownMs:0};
}


export function saveVocabriProgress(){
  try{ localStorage.setItem('vocabriProgress', JSON.stringify(S.vocabriProgress)); }catch(e){}
}


// On load (and defensively before any cooldown check), drop an expired lock.
export function refreshCooldownValidity(){
  if(S.vocabriProgress.enCooldown){
    if(Date.now() - S.vocabriProgress.ultimoTimestamp >= S.vocabriProgress.tiempoCooldownMs){
      S.vocabriProgress.enCooldown = false;
      S.vocabriProgress.seccionesCompletadasSeguidas = 0;
      saveVocabriProgress();
    }
  }
}


export function cooldownRemainingMs(){
  refreshCooldownValidity();
  if(!S.vocabriProgress.enCooldown) return 0;
  return Math.max(0, S.vocabriProgress.tiempoCooldownMs - (Date.now() - S.vocabriProgress.ultimoTimestamp));
}


export function fmtHhMmSs(ms){
  const s = Math.max(0, Math.ceil(ms/1000));
  const hh = String(Math.floor(s/3600)).padStart(2,'0');
  const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
  const ss = String(s%60).padStart(2,'0');
  return hh+':'+mm+':'+ss;
}


// Call right after a Sección (normal or exam) is marked complete.
export function registerSectionCompletion(cat, nodeIdx, wasExam, stars){
  S.vocabriProgress.categoriaActualId = cat;
  S.vocabriProgress.etapaActualId = String(etapaNameForSession(cat, nodeIdx));
  S.vocabriProgress.seccionActualId = cat + '|' + (nodeIdx+1);
  if(wasExam){
    S.vocabriProgress.seccionesCompletadasSeguidas = 0;
    S.vocabriProgress.enCooldown = true;
    S.vocabriProgress.ultimoTimestamp = Date.now();
    S.vocabriProgress.tiempoCooldownMs = COOLDOWN_EXAM_BY_STARS[stars] || COOLDOWN_EXAM_MS;
  } else {
    S.vocabriProgress.seccionesCompletadasSeguidas = (S.vocabriProgress.seccionesCompletadasSeguidas||0) + 1;
    if(S.vocabriProgress.seccionesCompletadasSeguidas >= MAX_CONSECUTIVE_NORMAL){
      S.vocabriProgress.seccionesCompletadasSeguidas = 0;
      S.vocabriProgress.enCooldown = true;
      S.vocabriProgress.ultimoTimestamp = Date.now();
      S.vocabriProgress.tiempoCooldownMs = COOLDOWN_NORMAL_MS;
    }
  }
  saveVocabriProgress();
}


export function getCurrentStage(cat){
  if(!(cat in S.currentStageByCat)) S.currentStageByCat[cat] = getUnlockedStage(cat);
  return S.currentStageByCat[cat];
}


export function setCurrentStage(cat, idx){ S.currentStageByCat[cat] = idx; }

 // {id, en, es, cat}

// Built-in content only (what the stage map is made of). The map has no editing features.
export function baseItems(c, includeCustom){
  // Clave estable: si la frase trae id (JSON) se usa el id; si no, su posición (datos internos)
  const out = DATA[c] ? DATA[c].map((it,i)=> [it[0], it[1], c, c+'|'+(it[4]||i), it[2]||null, it[3]||null]) : [];
  if(includeCustom !== false){
    S.customWords.filter(w=> w.cat===c).forEach(w=> out.push([w.en, w.es, c, 'custom|'+w.id, w.ex||null, w.exEs||null]));
  }
  return out;
}


// All cards (built-in + the user's own from "Mis Tarjetas") — used by tables, stats and exam distractors.
export function itemsFor(cat, includeCustom){
  if(cat === "Todas"){
    let all = [];
    allCats().forEach(c=> { if(MASTER_IDS.indexOf(c) >= 0) all = all.concat(baseItems(c, false)); });
    // Tarjetas propias: todas, una sola vez, sea cual sea su etiqueta
    if(includeCustom !== false) S.customWords.forEach(w=> all.push([w.en, w.es, w.cat, 'custom|'+w.id, w.ex||null, w.exEs||null]));
    return all;
  }
  return baseItems(cat, includeCustom);
}


// Cards that belong to the stage map: built-in only, so "Mis Tarjetas" never mixes into the route.
export function mapItemsFor(cat){ return itemsFor(cat, false); }



export function readStored(key){
  const dflt = {m:false, t:null, mt:null, lvl:0, next:null, iv:0, lapses:0, rl:false, reps:0};
  let raw;
  try{ raw = localStorage.getItem("ci_master_"+key); }catch(e){ return dflt; }
  if(!raw) return dflt;
  if(raw === "1") return Object.assign({}, dflt, {m:true, lvl:3});
  if(raw === "0") return dflt;
  try{
    const o = JSON.parse(raw);
    return {m:!!o.m, t:o.t||null, mt:o.mt||null, lvl:o.lvl||0, next:o.next||null, iv:o.iv||0, lapses:o.lapses||0, rl:!!o.rl, reps:o.reps||0};
  }catch(e){ return dflt; }
}


export function writeCard(key, rec){
  try{ localStorage.setItem("ci_master_"+key, JSON.stringify(rec)); }catch(e){}
  srsInvalidate();
}


export function isMastered(key){ return readStored(key).m; }


export function setMastered(key,val){
  try{
    const cur = readStored(key);
    localStorage.setItem("ci_master_"+key, JSON.stringify(Object.assign({}, cur, {m:!!val})));
  }catch(e){}
  srsInvalidate();
}


// Lecciones del mapa (3 botones) → mismo motor SRS que el Repaso. Devuelve {applied}.
// 1 Difícil → "Otra vez" · 2 Bien → "Bien" · 3 Fácil → "Fácil" (mínimo 10 días, como antes).
export function rateCard(key, level){
  if(!key) return {applied:false};
  const grade = level === 1 ? 1 : (level === 2 ? 3 : 4);
  return srsGrade(key, grade, {minIv: level === 3 ? 10 : 0});
}


export function getExamResult(cat, nodeIdx){
  try{ return JSON.parse(localStorage.getItem('vocabri_exam_'+cat+'_'+nodeIdx)||'null'); }catch(e){ return null; }
}


// Estrellas según el porcentaje de aciertos: ≥90 % ★★★ · ≥75 % ★★ · resto ★
export function examStarsFor(score, total){
  const p = total ? score / total : 0;
  return p >= 0.9 ? 3 : (p >= 0.75 ? 2 : 1);
}


export function examStarsOf(cat, nodeIdx){
  const r = getExamResult(cat, nodeIdx);
  return r ? examStarsFor(Number(r.score) || 0, Number(r.total) || 0) : 0;
}


// Guarda siempre la MEJOR nota (score/total) y cuenta los intentos. Devuelve si era la primera vez y las estrellas.
export function setExamResult(cat, nodeIdx, score, total){
  const prev = getExamResult(cat, nodeIdx);
  const prevFrac = (prev && prev.total) ? prev.score / prev.total : -1;
  const frac = total ? score / total : 0;
  const best = frac > prevFrac ? {score, total} : {score:prev.score, total:prev.total};
  try{
    localStorage.setItem('vocabri_exam_'+cat+'_'+nodeIdx, JSON.stringify({
      done:true, score:best.score, total:best.total, t:Date.now(), attempts:((prev && prev.attempts) || 0) + 1, last:{score, total}
    }));
  }catch(e){}
  return {
    first: !prev,
    prevStars: prev ? examStarsFor(Number(prev.score) || 0, Number(prev.total) || 0) : 0,
    stars: examStarsFor(best.score, best.total)
  };
}


export function allMasteredTimestamps(){
  let out = [];
  itemsFor("Todas").forEach(it=>{
    const s = readStored(it[3]);
    if(s.m && s.mt) out.push(s.mt);
  });
  return out.sort((a,b)=>a-b);
}


export function computeStreak(){
  const days = new Set();
  itemsFor("Todas").forEach(it=>{ const s = readStored(it[3]); if(s.t) days.add(dayKey(new Date(s.t))); });
  const today = new Date();
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if(!days.has(dayKey(cursor))){
    cursor.setDate(cursor.getDate()-1);
    if(!days.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while(days.has(dayKey(cursor))){ streak++; cursor.setDate(cursor.getDate()-1); }
  return streak;
}


export function todayKeyStr(){ return dayKey(new Date()); }

// Sentencias de nivel superior del original, en su orden de ejecución (main.js las ordena por línea).
export const __inits = [
  [647, function(){

// 'general' usa el contenido de DATA.Casual (ver phraseLoader.js): comparte sus zonas con nombre
CAT_MODULE_SIZES.general = CAT_MODULE_SIZES.Casual;
  }],
  [648, function(){
CAT_MODULE_NAMES.general = CAT_MODULE_NAMES.Casual;
  }],
  [658, function(){
   // el examen cuenta cada 2 secciones aunque crucen de zona
Object.keys(JSON_ZONES).forEach(c=>{ CAT_MODULE_SIZES[c] = JSON_ZONES[c].sizes; CAT_MODULE_NAMES[c] = JSON_ZONES[c].names; });
  }],
  [665, function(){
S.customCats = [];
  }],
  [666, function(){
try{ S.customCats = JSON.parse(localStorage.getItem('ci_custom_cats')||'[]'); }catch(e){}
  }],
  [681, function(){
S.unlockedStage = {};
  }],
  [682, function(){
try{ S.unlockedStage = JSON.parse(localStorage.getItem('vocabri_unlocked_stage')||'{}'); }catch(e){ S.unlockedStage = {}; }
  }],
  [683, function(){
S.currentStageByCat = {};
  }],
  [697, function(){
S.vocabriProgress = defaultVocabriProgress();
  }],
  [698, function(){
try{
  const raw = JSON.parse(localStorage.getItem('vocabriProgress'));
  if(raw) S.vocabriProgress = Object.assign(defaultVocabriProgress(), raw);
}catch(e){}
  }],
  [1827, function(){
S.currentCat = "general";
  }],
  [1828, function(){
S.view = "learn";
  }],
  [1829, function(){
S.order = [];
  }],
  [1830, function(){
S.idx = 0;
  }],
  [1831, function(){
S.curKey = null;
  }],
  [1832, function(){
S.suppressCardClick = false;
  }],
  [1834, function(){
S.customWords = [];
  }]
];

// ---------------------------------------------------------------------------
// Carga del JSON de frases (la usa phraseLoader.js)
// Formato del JSON: { categories: { travel_and_survival:[{id,en,es,ex,exEs}], ... } }
// Formato interno : DATA[cat] = [[en, es, ex, exEs, id], ...]
// ---------------------------------------------------------------------------
export const JSON_CATEGORY_MAP = getJsonCategoryMap();
export function initializeDataRegistry(jsonData){
  const cats = (jsonData && jsonData.categories) || jsonData || {};
  for(const [jsonKey, catId] of Object.entries(JSON_CATEGORY_MAP)){
    if(Array.isArray(cats[jsonKey])){
      DATA[catId] = cats[jsonKey].map(it => [it.en, it.es, it.ex || '', it.exEs || '', it.id || '']);
    }
  }
  DATA.general = DATA.Casual;          // 'general' comparte el contenido de Casual
  return DATA;
}
__inits.push([0, function(){ DATA.general = DATA.Casual; window.DATA = DATA; window.initializeDataRegistry = initializeDataRegistry; }]);
