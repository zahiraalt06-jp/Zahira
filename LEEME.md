# El último secreto

Aventura de plataformas 2D en HTML, CSS y JavaScript. Incluye una portada navideña rosa pastel sin texto de contraseña en la ilustración, cinco mundos, preguntas personalizadas y mensajes de ánimo. El movimiento del gatito usa fotogramas recortados y una inversión estable al girar; las plataformas, saltos y estrellas se han hecho más accesibles.

## Probar en local
1. Descomprime el ZIP.
2. Abre `index.html` en un navegador moderno. Para evitar restricciones locales de algunos navegadores, también puedes usar Live Server.

## Publicar en GitHub Pages
1. Sube `index.html`, `style.css`, `script.js` y la carpeta `assets` al repositorio.
2. En Settings → Pages, elige **Deploy from a branch**.
3. Selecciona `main` y `/ (root)`, guarda y espera a que GitHub publique la página.

## Controles
- Ordenador: flechas o A/D para moverse; Espacio, W o flecha arriba para saltar; Escape para pausar.
- Móvil: botones táctiles inferiores.
- Reinicio de mundo: botón ↻.

## Acceso
Contraseña: `Cádiz21`

## Personalización
- El mensaje final y los mensajes cariñosos están en `script.js`.
- Las cinco preguntas y sus respuestas están en el array `worlds`, al principio de `script.js`.
- Los sprites del gatito están en `assets/`.

## Nota de desarrollo
El juego incluye cinco mundos, plataformas, enemigos, estrellas, llave, puerta, cofre, punto de control, preguntas, vidas, pausa, reinicio y controles táctiles.
