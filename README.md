# 💣 Operación Bomba

Juego presencial para grupos de 30+ personas con sincronización en tiempo real via Firebase.

---

## 🚀 Setup paso a paso

### 1. Configurar Firebase

1. Ir a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Crear un nuevo proyecto (ej: `operacion-bomba`)
3. En el panel lateral: **Firestore Database** → "Crear base de datos" → Modo **producción** → elegir ubicación
4. En el panel lateral: **Configuración del proyecto** (ícono ⚙️) → pestaña **Aplicaciones web** → "Agregar aplicación" → copiar los valores de `firebaseConfig`
5. Abrir `src/lib/firebase.js` y pegar los valores reales

### 2. Reglas de Firestore

En Firebase Console → Firestore → **Reglas**, pegar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /game/{document} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Estas reglas son abiertas para facilitar el juego. Para producción real podés añadir autenticación.

### 3. Personalizar el juego

Editá `src/lib/gameConfig.js`:

- **TEAMS**: podés cambiar nombres, colores, emojis de los equipos
- **TOTAL_BOMBS**: cuántas bombas tiene cada equipo (default: 5)
- **VALID_CODES**: los códigos válidos. Generá uno por participante y pegalo en la espalda de cada jugador (podés usar tarjetitas impresas)

Ejemplo de generador rápido de códigos únicos (corré en la consola del browser):
```js
Array.from({length: 40}, (_, i) => `BOMB${String(i+1).padStart(2,'0')}`).join('\n')
```

### 4. Instalar y correr localmente

```bash
cd bomb-game
npm install
npm start
```

La app abre en [http://localhost:3000](http://localhost:3000)

### 5. Desplegar en Vercel

#### Opción A: Via CLI
```bash
npm install -g vercel
vercel --prod
```

#### Opción B: Via GitHub
1. Subir el proyecto a un repositorio de GitHub
2. Ir a [https://vercel.com](https://vercel.com) → "New Project" → importar el repo
3. Vercel detecta automáticamente que es Create React App
4. Click en "Deploy" → en 1-2 minutos tenés tu URL para compartir

### 6. Variables de entorno (opcional pero recomendado)

En lugar de hardcodear las keys en `firebase.js`, podés crear un archivo `.env.local`:

```
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id
```

Y en firebase.js usar `process.env.REACT_APP_FIREBASE_API_KEY` etc.
En Vercel, agregarlas en Settings → Environment Variables.

---

## 🎮 Cómo jugar

1. El organizador reparte tarjetas con códigos a cada participante (pegadas en la espalda)
2. Los jugadores abren el link desde el celular y eligen su equipo
3. Cada jugador intenta leer el código en la espalda de otro jugador del mismo u otro equipo
4. Ingresan el código en la app → si es válido, desactivan una bomba de su equipo
5. Gana el equipo que primero desactive sus 5 bombas

---

## 📁 Estructura del proyecto

```
bomb-game/
├── public/
│   └── index.html
├── src/
│   ├── lib/
│   │   ├── firebase.js      ← Configuración Firebase
│   │   └── gameConfig.js    ← Equipos, bombas y códigos
│   ├── hooks/
│   │   └── useGame.js       ← Lógica del juego + Firestore
│   ├── pages/
│   │   ├── TeamSelect.jsx   ← Pantalla de selección de equipo
│   │   ├── GameBoard.jsx    ← Pantalla principal del juego
│   │   └── Ranking.jsx      ← Pantalla de ranking
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── vercel.json
└── package.json
```

---

## 🔧 Resetear el juego

Si querés reiniciar para jugarlo de nuevo, podés llamar a `resetGame()` desde la consola del browser o agregar un botón de admin. También podés borrar los documentos en Firestore manualmente desde la consola de Firebase.
