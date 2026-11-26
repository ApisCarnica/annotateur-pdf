# Annotateur PDF

Logiciel Windows pour annoter un PDF au stylet et l'enregistrer.

## Fonctions

- Stylo sensible à la pression, surligneur, gomme, texte, ligne, flèche, rectangle et ellipse (Maj = carré ou cercle)
- 7 couleurs et un sélecteur libre, réglage de l'épaisseur
- Annuler / rétablir, effacer la page affichée
- Zoom (Ctrl + molette), ajustement à la largeur
- Mode « Stylet seul » : le doigt fait défiler la page, seul le stylet écrit (la paume n'écrit pas)
- Enregistrement d'un nouveau PDF (`nom_annoté.pdf`) : l'original n'est pas modifié
- Ouverture d'un PDF par double-clic ou par « Ouvrir avec » depuis l'Explorateur
- Mises à jour automatiques

Raccourcis : P stylo, H surligneur, E gomme, T texte, L ligne, A flèche, R rectangle, O ellipse, V main ; Ctrl+O, Ctrl+S, Ctrl+Z, Ctrl+Y.

## Obtenir l'installateur .exe (une seule fois)

L'installateur est fabriqué gratuitement par GitHub, sans rien installer sur votre ordinateur.

1. Créez un compte sur github.com, puis un dépôt nommé `annotateur-pdf`. Il peut être privé, mais les mises à jour automatiques ne fonctionnent qu'avec un dépôt **public**.
2. Le compte GitHub utilisé est `ApisCarnica` (indiqué dans `package.json`).
3. Envoyez tout le contenu de ce dossier dans le dépôt (bouton « Add file › Upload files », y compris le dossier caché `.github`).
4. Onglet « Actions » › « Construire l'installateur Windows » › bouton « Run workflow ».
5. Après environ 5 minutes, une release `v1.0.0` apparaît dans l'onglet « Releases » avec le fichier `Annotateur-PDF-Setup-1.0.0.exe`. Téléchargez-le et lancez-le.

Windows peut afficher « Windows a protégé votre ordinateur », car le logiciel n'est pas signé : cliquez sur « Informations complémentaires » › « Exécuter quand même ».

## Publier une mise à jour

1. Remplacez les fichiers modifiés dans le dépôt.
2. Dans `package.json`, augmentez `"version"` (par exemple `1.0.1`).
3. Onglet « Actions » › « Construire l'installateur Windows » › « Run workflow ». La release `v1.0.1` est créée automatiquement.

Les ordinateurs où le logiciel est installé téléchargent la mise à jour au démarrage, puis proposent de redémarrer. Le menu Aide › « Rechercher les mises à jour » lance aussi la vérification.

## Fabriquer l'installateur sur votre propre PC (méthode alternative)

Installez Node.js (nodejs.org), puis lancez dans ce dossier :

```
npm install
npm run dist
```

L'installateur est créé dans le dossier `dist`. Pour tester sans installer, lancez `npm start`.
