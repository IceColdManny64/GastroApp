import { RawRecipeDto } from '../types/RecipeItem'; // Tipo crudo de las 30 recetas de respaldo cuando server.js está apagado

export const INITIAL_RECIPES_DATA: RawRecipeDto[] = [ // Exporta el arreglo constante de recetas de respaldo sin conexión
  { // Inicia objeto de la receta #1 de respaldo
    id: 1, // Identificador numérico único de la receta (1)
    title: 'Un manjar de italia: la pizza', // Título de la receta: Un manjar de italia: la pizza
    description: 'Descubre algo mas sobre este manjar!', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480_1_5x/img/recipe/ras/Assets/48a49653c8716457eb0b2f7eb3c7d74c/Derivates/8d83d9ed4567fa15456d8eec7557e60006a15576.jpg', // Enlace HTTPS remoto a la foto de la receta #1 (Un manjar de italia: la pizza)
    preparetime: '01:00:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Italianas', // Categoría gastronómica asignada (Italianas)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #2 de respaldo
    id: 2, // Identificador numérico único de la receta (2)
    title: 'Kebab: Brocheta estilo europeo', // Título de la receta: Kebab: Brocheta estilo europeo
    description: 'Sabor delicioso en todas sus formas', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Lula_kebab_2.jpg/960px-Lula_kebab_2.jpg', // Enlace HTTPS remoto a la foto de la receta #2 (Kebab: Brocheta estilo europeo)
    preparetime: '00:20:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 75, // Porcentaje inicial de aprobación de la receta (75%)
    category: 'Orientales', // Categoría gastronómica asignada (Orientales)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #3 de respaldo
    id: 3, // Identificador numérico único de la receta (3)
    title: 'Enchiladas verdes', // Título de la receta: Enchiladas verdes
    description: 'Bañadas en salsa verde', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://familiakitchen.com/wp-content/uploads/2021/01/iStock-1178656148-enchiladas-low-res-v3.jpg', // Enlace HTTPS remoto a la foto de la receta #3 (Enchiladas verdes)
    preparetime: '00:40:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Medio', // Nivel de dificultad de la receta (Medio)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #4 de respaldo
    id: 4, // Identificador numérico único de la receta (4)
    title: 'Mole poblano', // Título de la receta: Mole poblano
    description: 'Delicia de muchos ingredientes', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://recetas.encolombia.com/wp-content/uploads/2022/08/Mole-Poblano.jpg', // Enlace HTTPS remoto a la foto de la receta #4 (Mole poblano)
    preparetime: '01:20:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 98, // Porcentaje inicial de aprobación de la receta (98%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Dificil', // Nivel de dificultad de la receta (Dificil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #5 de respaldo
    id: 5, // Identificador numérico único de la receta (5)
    title: 'Flautas', // Título de la receta: Flautas
    description: 'Por si traes ganas de fritanga', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://sabrosano.com/wp-content/uploads/2020/05/Flautas_res_principal.jpg', // Enlace HTTPS remoto a la foto de la receta #5 (Flautas)
    preparetime: '00:30:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 80, // Porcentaje inicial de aprobación de la receta (80%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #6 de respaldo
    id: 6, // Identificador numérico único de la receta (6)
    title: 'Pasta bolognesa', // Título de la receta: Pasta bolognesa
    description: 'Pasta con carne molida!', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://www.laespanolaaceites.com/wp-content/uploads/2019/05/espaguetis-a-la-bolonesa.jpg', // Enlace HTTPS remoto a la foto de la receta #6 (Pasta bolognesa)
    preparetime: '01:00:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 80, // Porcentaje inicial de aprobación de la receta (80%)
    category: 'Italianas', // Categoría gastronómica asignada (Italianas)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #7 de respaldo
    id: 7, // Identificador numérico único de la receta (7)
    title: 'Tamales', // Título de la receta: Tamales
    description: 'Un clásico con masa, carne y salsa', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://editorialtelevisa.brightspotcdn.com/dims4/default/ce58fd2/2147483647/strip/true/crop/560x560+220+0/resize/1000x1000!/quality/90/?url=https%3A%2F%2Fk2-prod-editorial-televisa.s3.us-east-1.amazonaws.com%2Fbrightspot%2Fwp-content%2Fuploads%2F2021%2F01%2Ftamales-verdes-de-pollo.jpg', // Enlace HTTPS remoto a la foto de la receta #7 (Tamales)
    preparetime: '01:00:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Medio', // Nivel de dificultad de la receta (Medio)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #8 de respaldo
    id: 8, // Identificador numérico único de la receta (8)
    title: 'Tacos al pastor', // Título de la receta: Tacos al pastor
    description: 'Un manjar galardonado globalmente', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://comedera.com/wp-content/uploads/sites/9/2017/08/tacos-al-pastor-receta.jpg', // Enlace HTTPS remoto a la foto de la receta #8 (Tacos al pastor)
    preparetime: '01:30:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 98, // Porcentaje inicial de aprobación de la receta (98%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Medio', // Nivel de dificultad de la receta (Medio)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #9 de respaldo
    id: 9, // Identificador numérico único de la receta (9)
    title: 'Hamburguesas de pollo', // Título de la receta: Hamburguesas de pollo
    description: 'Por si no hay res en casa', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://www.recetasnestle.com.ec/sites/default/files/srh_recipes/681c719667d572276a1507aea71de9ca.jpg', // Enlace HTTPS remoto a la foto de la receta #9 (Hamburguesas de pollo)
    preparetime: '01:00:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 75, // Porcentaje inicial de aprobación de la receta (75%)
    category: 'Estadounidenses', // Categoría gastronómica asignada (Estadounidenses)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #10 de respaldo
    id: 10, // Identificador numérico único de la receta (10)
    title: 'Sincronizadas sencillas', // Título de la receta: Sincronizadas sencillas
    description: 'Lo simple nunca te fallará', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://imag.bonviveur.com/sincronizadas-de-jamon-y-queso-foto-principal.jpg', // Enlace HTTPS remoto a la foto de la receta #10 (Sincronizadas sencillas)
    preparetime: '00:20:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Muy facil', // Nivel de dificultad de la receta (Muy facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #11 de respaldo
    id: 11, // Identificador numérico único de la receta (11)
    title: 'Caldo de pollo', // Título de la receta: Caldo de pollo
    description: 'Para combatir el frio con sustancia', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://sasonregional.com/wp-content/uploads/2024/08/image-2024-08-23T152428.388-1024x768.jpg', // Enlace HTTPS remoto a la foto de la receta #11 (Caldo de pollo)
    preparetime: '01:30:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 85, // Porcentaje inicial de aprobación de la receta (85%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Muy facil', // Nivel de dificultad de la receta (Muy facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #12 de respaldo
    id: 12, // Identificador numérico único de la receta (12)
    title: 'Huevos a la mexicana', // Título de la receta: Huevos a la mexicana
    description: 'Con todo el estilo del gran México', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://www.maricruzavalos.com/wp-content/uploads/2017/11/huevos-a-la-mexicana-recipe.jpg', // Enlace HTTPS remoto a la foto de la receta #12 (Huevos a la mexicana)
    preparetime: '00:20:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 80, // Porcentaje inicial de aprobación de la receta (80%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #13 de respaldo
    id: 13, // Identificador numérico único de la receta (13)
    title: 'Ensalada César', // Título de la receta: Ensalada César
    description: 'Una opcion saludable', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://www.goodnes.com/sites/g/files/jgfbjl321/files/srh_recipes/755f697272cbcdc6e5df2adb44b1b705.jpg', // Enlace HTTPS remoto a la foto de la receta #13 (Ensalada César)
    preparetime: '00:25:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 80, // Porcentaje inicial de aprobación de la receta (80%)
    category: 'Saludables', // Categoría gastronómica asignada (Saludables)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #14 de respaldo
    id: 14, // Identificador numérico único de la receta (14)
    title: 'Pizza margarita', // Título de la receta: Pizza margarita
    description: 'Una tradicion de italia', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://assets.elgourmet.com/wp-content/uploads/2023/03/Fm5utL5Ga4fRKIMETODOS2WoqKu8CWS2apF.png', // Enlace HTTPS remoto a la foto de la receta #14 (Pizza margarita)
    preparetime: '01:00:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Italianas', // Categoría gastronómica asignada (Italianas)
    difficulty: 'Medio', // Nivel de dificultad de la receta (Medio)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #15 de respaldo
    id: 15, // Identificador numérico único de la receta (15)
    title: 'Flan napolitano', // Título de la receta: Flan napolitano
    description: 'Un postre con base de huevo', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://peopleenespanol.com/thmb/pBjjGnmRLuhiPv5bAN6-MhhQZqY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/flan-napolitano-tradicional-2000-56d3d74137b34a0f992b5746b7cc1e38.jpg', // Enlace HTTPS remoto a la foto de la receta #15 (Flan napolitano)
    preparetime: '00:30:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 95, // Porcentaje inicial de aprobación de la receta (95%)
    category: 'Postres', // Categoría gastronómica asignada (Postres)
    difficulty: 'Medio', // Nivel de dificultad de la receta (Medio)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #16 de respaldo
    id: 16, // Identificador numérico único de la receta (16)
    title: 'Smoothie verde', // Título de la receta: Smoothie verde
    description: 'Una mezcla de verduras', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://www.vitamixespana.com/recetas/wp-content/uploads/2018/04/smoothie-verde-vitamix.jpg', // Enlace HTTPS remoto a la foto de la receta #16 (Smoothie verde)
    preparetime: '00:10:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Saludables', // Categoría gastronómica asignada (Saludables)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #17 de respaldo
    id: 17, // Identificador numérico único de la receta (17)
    title: 'Hamburguesa de camaron', // Título de la receta: Hamburguesa de camaron
    description: 'Un clasico con mariscos', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://www.cocinavital.mx/wp-content/uploads/2018/03/receta-de-hamburguesa-de-camaron-con-queso.jpg', // Enlace HTTPS remoto a la foto de la receta #17 (Hamburguesa de camaron)
    preparetime: '01:00:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 70, // Porcentaje inicial de aprobación de la receta (70%)
    category: 'Estadounidenses', // Categoría gastronómica asignada (Estadounidenses)
    difficulty: 'Medio', // Nivel de dificultad de la receta (Medio)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #18 de respaldo
    id: 18, // Identificador numérico único de la receta (18)
    title: 'Salpicon de camaron', // Título de la receta: Salpicon de camaron
    description: 'Algo fresquito', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://cheforopeza.com.mx/wp-content/uploads/2017/07/tostaditas-de-salpicon-de-camaron_recetas_chef-oropeza-jpg', // Enlace HTTPS remoto a la foto de la receta #18 (Salpicon de camaron)
    preparetime: '01:30:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 80, // Porcentaje inicial de aprobación de la receta (80%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #19 de respaldo
    id: 19, // Identificador numérico único de la receta (19)
    title: 'Fajitas de pollo', // Título de la receta: Fajitas de pollo
    description: 'Fritanga sabrosa', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://cdn.recetasderechupete.com/wp-content/uploads/2014/05/fajitas_pollo.jpg', // Enlace HTTPS remoto a la foto de la receta #19 (Fajitas de pollo)
    preparetime: '01:00:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 60, // Porcentaje inicial de aprobación de la receta (60%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #20 de respaldo
    id: 20, // Identificador numérico único de la receta (20)
    title: 'Pasta de crema de hongos', // Título de la receta: Pasta de crema de hongos
    description: 'Suave y delicioso', // Descripción resumida del sabor o presentación del platillo
    imageURL: 'https://i.ytimg.com/vi/aPyrMFkxPPs/maxresdefault.jpg', // URL de imagen ilustrativa del platillo
    preparetime: '01:30:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Italianas', // Categoría gastronómica asignada (Italianas)
    difficulty: 'Medio', // Nivel de dificultad de la receta (Medio)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #21 de respaldo
    id: 21, // Identificador numérico único de la receta (21)
    title: 'Gelatina de mosaico', // Título de la receta: Gelatina de mosaico
    description: 'Un postre a veces incomprendido', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://www.recetasnestle.com.ec/sites/default/files/srh_recipes/1e75cd7dc9091722fec4f5cae018bb9a.jpg', // Enlace HTTPS remoto a la foto de la receta #21 (Gelatina de mosaico)
    preparetime: '00:40:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 79, // Porcentaje inicial de aprobación de la receta (79%)
    category: 'Postres', // Categoría gastronómica asignada (Postres)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #22 de respaldo
    id: 22, // Identificador numérico único de la receta (22)
    title: 'Carlota', // Título de la receta: Carlota
    description: 'Un postre alimonado', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://images.aws.nestle.recipes/original/71ff3eccec6532b6a2750fc4e1b9f4f2_imagen8.jpg', // Enlace HTTPS remoto a la foto de la receta #22 (Carlota)
    preparetime: '01:00:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 85, // Porcentaje inicial de aprobación de la receta (85%)
    category: 'Postres', // Categoría gastronómica asignada (Postres)
    difficulty: 'Medio', // Nivel de dificultad de la receta (Medio)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #23 de respaldo
    id: 23, // Identificador numérico único de la receta (23)
    title: 'Pollo al cilantro', // Título de la receta: Pollo al cilantro
    description: 'Rico saborcito a hierbas', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://sabrosano.com/wp-content/uploads/2020/05/FotoPaso_4-11-1-principal.jpg', // Enlace HTTPS remoto a la foto de la receta #23 (Pollo al cilantro)
    preparetime: '01:30:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Dificil', // Nivel de dificultad de la receta (Dificil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #24 de respaldo
    id: 24, // Identificador numérico único de la receta (24)
    title: 'Chili Dog', // Título de la receta: Chili Dog
    description: 'Un giro picosito', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://www.simplyrecipes.com/thmb/7ROH4eqjTVeOIhpR4ZWzLUe4CHQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__simply_recipes__uploads__2010__05__chili-dog-horiz-a-1600-1a1f025054124cd886baab5b14d8d5b6.jpg', // Enlace HTTPS remoto a la foto de la receta #24 (Chili Dog)
    preparetime: '01:20:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Estadounidenses', // Categoría gastronómica asignada (Estadounidenses)
    difficulty: 'Facil', // Nivel de dificultad de la receta (Facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #25 de respaldo
    id: 25, // Identificador numérico único de la receta (25)
    title: 'Ensalada de frutas', // Título de la receta: Ensalada de frutas
    description: 'Dulce pero sustanciosa', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://www.bancodealimentoschicago.org/wp-content/uploads/2022/04/Fruit-Salad.jpg', // Enlace HTTPS remoto a la foto de la receta #25 (Ensalada de frutas)
    preparetime: '00:10:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 95, // Porcentaje inicial de aprobación de la receta (95%)
    category: 'Saludables', // Categoría gastronómica asignada (Saludables)
    difficulty: 'Muy facil', // Nivel de dificultad de la receta (Muy facil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #26 de respaldo
    id: 26, // Identificador numérico único de la receta (26)
    title: 'Mojarra frita', // Título de la receta: Mojarra frita
    description: 'Mariscos y fritanga!', // Descripción resumida del sabor o presentación del platillo
    imageURL: 'https://i.ytimg.com/vi/lbwEsmmyTi4/maxresdefault.jpg', // URL de imagen ilustrativa del platillo
    preparetime: '01:30:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Dificil', // Nivel de dificultad de la receta (Dificil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #27 de respaldo
    id: 27, // Identificador numérico único de la receta (27)
    title: 'Tortitas de papa', // Título de la receta: Tortitas de papa
    description: 'Con quesito gratinado', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://laroussecocina.mx/wp-content/uploads/2020/01/S050419-08-TORTITAS-DE-PAPA-0383.jpg', // Enlace HTTPS remoto a la foto de la receta #27 (Tortitas de papa)
    preparetime: '00:30:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 79, // Porcentaje inicial de aprobación de la receta (79%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Medio', // Nivel de dificultad de la receta (Medio)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #28 de respaldo
    id: 28, // Identificador numérico único de la receta (28)
    title: 'Fetuccini con camarones', // Título de la receta: Fetuccini con camarones
    description: 'El sabor de Italia en el mar', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://www.cocinavital.mx/wp-content/uploads/2017/10/fetuccinicamarones-1.jpg', // Enlace HTTPS remoto a la foto de la receta #28 (Fetuccini con camarones)
    preparetime: '02:00:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 98, // Porcentaje inicial de aprobación de la receta (98%)
    category: 'Italianas', // Categoría gastronómica asignada (Italianas)
    difficulty: 'Dificil', // Nivel de dificultad de la receta (Dificil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #29 de respaldo
    id: 29, // Identificador numérico único de la receta (29)
    title: 'Lomo relleno', // Título de la receta: Lomo relleno
    description: 'Un clásico para navidad', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://editorialtelevisa.brightspotcdn.com/wp-content/uploads/2019/12/lomo-relleno-navideno.jpg', // Enlace HTTPS remoto a la foto de la receta #29 (Lomo relleno)
    preparetime: '01:30:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Mexicanas', // Categoría gastronómica asignada (Mexicanas)
    difficulty: 'Dificil', // Nivel de dificultad de la receta (Dificil)
  }, // Cierra el objeto de la receta actual
  { // Inicia objeto de la receta #30 de respaldo
    id: 30, // Identificador numérico único de la receta (30)
    title: 'Tiramisu', // Título de la receta: Tiramisu
    description: 'Chocolate amargo y delicioso', // Descripción resumida del sabor o presentación del platillo
    imageURL: // URL de imagen ilustrativa del platillo
      'https://www.paulinacocina.net/wp-content/uploads/2020/01/receta-de-tiramisu-facil-y-economico-1740483918-1200x900.jpg', // Enlace HTTPS remoto a la foto de la receta #30 (Tiramisu)
    preparetime: '00:30:00', // Tiempo de preparación en formato HH:MM:SS
    likerate: 90, // Porcentaje inicial de aprobación de la receta (90%)
    category: 'Postres', // Categoría gastronómica asignada (Postres)
    difficulty: 'Medio', // Nivel de dificultad de la receta (Medio)
  }, // Cierra el objeto de la receta actual
]; // Cierra el arreglo completo de recetas iniciales
