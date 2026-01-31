// 1. IMPORTAMOS LAS IMÁGENES AL PRINCIPIO
// (Asegúrate de que los nombres coincidan exactamente con tu carpeta: tags1.png y tags2.png)
import tagImg1 from '../assets/tags/tags1.png';
import tagImg2 from '../assets/tags/tags2.png';

export const PLAYER_TAGS = [
    { 
        id: 'tag1', 
        name: 'Midnight Cactus', 
        type: 'image',
        src: tagImg1, // 2. Usamos la variable importada aquí (sin comillas)
        textColor: '#fff' 
    },
    { 
        id: 'tag2', 
        name: 'Aqua Bubbles', 
        type: 'image',
        src: tagImg2, // Usamos la variable importada
        textColor: '#fff'
    }
];