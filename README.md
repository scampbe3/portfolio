# Portal Portfolio Scene

An interactive Three.js portfolio room with first-person controls, mobile thumbsticks, a sci-fi portal, and a console that previews four projects. Selecting a console button updates the portal video and console screen; entering the portal opens the selected project in a new tab and resets the scene.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the static server:

```bash
npm start
```

Open:

```text
http://localhost:4173/
```

Do not open `index.html` directly from the filesystem. Browser module and media loading require the local HTTP server.

## Mobile Testing

Start the server on the computer, then open the computer's LAN IP from a phone on the same network:

```text
http://YOUR_LAN_IP:4173/
```

The scene shows mobile movement and look sticks on touch devices.

## Validation

Run:

```bash
npm run check
```

This checks the server and scene JavaScript for syntax errors.

## Project Assets

The current scene uses only the GLB, PNG, and MP4 assets kept in this repository. Old OBJ/MTL source exports, preview artifacts, and retired model versions have been removed to keep the repo upload focused.
"# portfolio" 
