# Mes Séances

Petite Progressive Web App perso pour afficher mon programme de musculation directement sur mon téléphone à la salle de sport — pas besoin de carnet ni de PDF, juste ouvrir l'app et suivre les exercices, séries et reps du jour.

**App en ligne :** https://pinheiro-andre.github.io/workout/

## Fonctionnalités

- Deux séances (Workout A / Workout B) avec exercices, séries et reps
- Case à cocher par exercice, remise à zéro chaque jour
- Log du poids et des reps réellement faits, avec pré-remplissage basé sur la dernière fois
- Illustration + animation par exercice
- Écran Statistiques : volume et séances par semaine/mois
- Export/import JSON pour sauvegarder son historique
- Installable sur écran d'accueil Android, fonctionne hors-ligne

## Technique

Site statique sans build ni dépendances (HTML/CSS/JS vanilla), hébergé sur GitHub Pages. Le programme est entièrement défini dans [data/workouts.json](data/workouts.json) — le modifier suffit pour changer les séances.

Pour tester en local :

```
python3 -m http.server 8000
```

puis ouvrir `http://localhost:8000`.

## Illustrations

Photos et animations issues de [Gym visual](https://gymvisual.com/) — usage personnel uniquement (voir la licence du dataset source).
