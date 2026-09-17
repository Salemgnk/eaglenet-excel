# Suivi données rizerie — remplacement Airtable

*17 septembre 2026*

## Le problème

Les opérateurs terrain saisissent les données de production (sacs moulus, revenus, dépenses) dans Airtable, mais la connexion Internet sur site est instable.

- Résultat : les fiches ne sont pas remplies régulièrement, avec des trous et des retards de plusieurs jours.
- Le patron a besoin de ces chiffres dans son fichier Excel de suivi le plus vite possible après chaque saisie.
- Toute solution doit donc fonctionner même sans connexion, tout en gardant les données fiables une fois soumises.

## Objectifs et contraintes

1. **Fonctionner hors-ligne** : saisie possible sans réseau, synchronisation automatique dès que la connexion revient.
2. **Intégrité des données** : une fois soumise, une entrée ne doit plus pouvoir être modifiée librement par l'opérateur terrain.
3. **Vitesse vers Excel** : les données validées doivent atteindre le fichier du patron le plus vite possible, idéalement en quelques minutes.
4. **Simplicité d'usage** : app légère, installable sur mobile, pas de compte compliqué à gérer sur le terrain.

## Options considérées

| Option | Fiabilité hors-ligne | Contrôle des données | Vitesse vers Excel | Effort |
| --- | --- | --- | --- | --- |
| Rester sur Airtable | Faible — bloqué sans réseau | Faible — tout le monde peut tout modifier | Moyen — export/sync manuel | Aucun |
| Google Sheets + app tierce | Faible à moyenne | Faible | Moyen | Faible |
| PWA sur mesure, offline-first (recommandé) | Élevée — saisie locale, sync auto | Élevée — verrouillage après soumission + historique | Élevée — push automatique | Élevé — développement sur mesure |

## Solution recommandée : PWA offline-first

Une application web progressive (PWA), installable sur le téléphone de l'opérateur, avec ce flux :

1. **Saisie locale** : le formulaire (sacs moulus, revenus, dépenses, autres) écrit d'abord dans le stockage local du téléphone (IndexedDB) — fonctionne même sans réseau.
2. **Synchronisation automatique** : dès qu'une connexion est détectée, les entrées en attente sont envoyées au serveur, en arrière-plan, sans action de l'utilisateur.
3. **Verrouillage après soumission** : une fois synchronisée, une entrée passe en lecture seule pour l'opérateur. Une correction n'est possible que via une demande tracée (motif + historique des modifications).
4. **Push vers Excel** : dès qu'une entrée est confirmée côté serveur, elle est poussée automatiquement vers le fichier du patron (ex. via l'API Microsoft Graph / Power Automate si Excel est sur OneDrive-SharePoint, ou l'API Google Sheets si le patron accepte un Sheet connecté). Le délai visé est de quelques minutes après la sync, pas un export manuel en fin de journée.

Cette architecture répond directement aux trois contraintes : fiabilité terrain (stockage local), intégrité (verrouillage + audit) et rapidité (push automatique au lieu d'une saisie/export manuelle).

## Prochaines étapes

- [ ] Confirmer la liste exacte des champs à saisir (sacs moulus, revenus, dépenses, autres catégories)
- [ ] Décider du point d'arrivée côté patron (Excel sur OneDrive/SharePoint vs Google Sheet connecté)
- [ ] Construire un prototype PWA (un formulaire, stockage local, sync)
- [ ] Tester en conditions réelles avec un client ayant une connexion instable
- [ ] Mettre en place le verrouillage des entrées et l'historique des modifications
