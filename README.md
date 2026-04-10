# Interface moderne n8n → Google Sheets

Ce mini-projet fournit une interface front moderne pour :

- visualiser un flux n8n en **chart** (diagramme Mermaid) ;
- afficher un **script n8n** prêt à copier ;
- explorer les lignes d'un Google Sheet ;
- suivre des métriques avec des graphiques (Chart.js).

## Lancer le projet

```bash
python3 -m http.server 8000
```

Puis ouvre : `http://localhost:8000`.

## Fichiers

- `index.html` : structure de l'interface.
- `styles.css` : style moderne sombre.
- `app.js` : données mock, rendu du flow, tableaux et graphiques.

## Personnalisation

Tu peux remplacer le tableau `sheetRows` dans `app.js` par les données issues de ton webhook n8n ou de l'API Google Sheets.
