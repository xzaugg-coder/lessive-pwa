# Lessive PWA

Application web simple pour suivre les lavages et sechages sur une annee, avec sauvegarde locale, mode hors ligne et impression en PDF.

## Tester sur votre PC

Option simple :

1. Ouvrir le dossier du projet.
2. Lancer un petit serveur local dans ce dossier.
3. Ouvrir l'adresse locale dans Chrome.

Avec Python, depuis le dossier du projet :

```powershell
python -m http.server 8080
```

Puis ouvrir :

```text
http://localhost:8080
```

Il est aussi possible d'ouvrir `index.html` directement, mais l'installation PWA et le fonctionnement hors ligne via service worker demandent normalement une adresse `http://localhost` ou un site `https`.

## Exemple de saisie

Dans l'application, vous pouvez ajouter par exemple :

```text
14.01.2026 : 3 lavages, 1 sechage
20.01.2026 : 1 lavage, 0 sechage
```

Ces donnees ne sont pas prechargees dans l'application.

## Heberger gratuitement sur GitHub Pages

1. Creer un depot GitHub, par exemple `lessive-pwa`.
2. Envoyer les fichiers du projet dans ce depot.
3. Sur GitHub, ouvrir `Settings`.
4. Aller dans `Pages`.
5. Dans `Build and deployment`, choisir `Deploy from a branch`.
6. Choisir la branche principale, souvent `main`, puis le dossier `/root`.
7. Enregistrer.
8. GitHub affiche ensuite une adresse du type :

```text
https://votre-compte.github.io/lessive-pwa/
```

## Ouvrir sur une tablette Android

1. Ouvrir Chrome sur la tablette.
2. Aller sur l'adresse GitHub Pages de l'application.
3. Attendre le chargement complet une premiere fois.
4. L'application pourra ensuite fonctionner hors ligne avec les fichiers mis en cache.

## Ajouter a l'ecran d'accueil

1. Ouvrir l'application dans Chrome sur Android.
2. Appuyer sur le menu Chrome avec les trois points.
3. Choisir `Ajouter a l'ecran d'accueil` ou `Installer l'application`.
4. Valider le nom propose.
5. L'icone apparait ensuite sur l'ecran d'accueil.

## Exporter ou imprimer en PDF

1. Choisir l'annee voulue dans l'application.
2. Verifier les lignes et les totaux.
3. Appuyer sur `Exporter / Imprimer en PDF`.
4. Dans la fenetre d'impression Android ou Chrome, choisir `Enregistrer en PDF` si disponible.
5. Utiliser un nom du type :

```text
Lessive_2026.pdf
```

Le PDF contient seulement le titre, le tableau et les totaux. Il ne contient pas de nom, adresse, appartement ou signature.

## Sauvegarder et restaurer les donnees

Les donnees sont enregistrees localement dans le navigateur de la tablette. Si vous supprimez les cookies, les donnees de site, le cache de Chrome, ou si vous reinitialisez la tablette, vous pouvez perdre ces donnees.

Il est donc conseille de faire regulierement une sauvegarde JSON :

1. Appuyer sur `Sauvegarder les donnees`.
2. Conserver le fichier JSON obtenu, par exemple dans Google Drive, OneDrive, une cle USB ou un autre endroit sur.
3. Le fichier peut s'appeler `Sauvegarde_lessives_2026.json` s'il contient une seule annee, ou `Sauvegarde_lessives_complete.json` s'il contient plusieurs annees.

Pour restaurer une sauvegarde :

1. Appuyer sur `Restaurer une sauvegarde`.
2. Choisir le fichier JSON exporte auparavant.
3. Confirmer la restauration.

Attention : la restauration peut remplacer les donnees existantes pour les annees presentes dans le fichier.
