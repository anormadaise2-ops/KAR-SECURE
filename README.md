# KAR SECURE

Application de diagnostic systeme locale par Zercraft.

## Prerequis

- Windows 10 ou Windows 11
- Node.js version LTS
- npm

## Installation

```powershell
npm install
````

## Lancer l'application

```powershell
npm start
```

## Creer le ZIP du code source

```powershell
npm run zip
```

## Compiler l'installateur Windows

```powershell
npm run dist
```

Le ZIP est genere a la racine du projet. L'installateur est genere dans le dossier release.

## Limites

Les temperatures dependent des capteurs accessibles. Certains ordinateurs ne publient pas leurs temperatures aux applications tierces.

L'inventaire des pilotes lit les informations exposees par Windows. La presence d'un pilote dans la liste ne garantit pas qu'il est a jour ou sans probleme.

KAR SECURE ne remplace pas un antivirus et ne fait pas d'overclocking automatique.
