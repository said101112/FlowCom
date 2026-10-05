"""Validation hors-ligne des fichiers YAML de deploiement.

Verifie que chaque document est un YAML valide et que les cles attendues
sont presentes. Les manifests Kubernetes sont volontairement absents de cette
branche : ils sont maintenus sur `dev`.

Usage : python scripts/validate-manifests.py
"""

import pathlib
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Chaque cible associe le chemin et la liste de cles obligatoires par document.
# Les workflows GitHub Actions utilisent `on`/`jobs`, pas `apiVersion`/`kind`.
DIRECTORIES = [
    (ROOT / ".github" / "workflows", ("jobs",)),
]
FILES = [
    (ROOT / "docker-compose.yml", ("services",)),
]

errors = []
documents = 0


def check_document(path: pathlib.Path, doc, index: int, required_keys) -> None:
    global documents

    documents += 1
    label = f"{path.relative_to(ROOT)}#{index}"

    if not isinstance(doc, dict):
        errors.append(f"{label}: le document n'est pas un mapping")
        return

    for key in required_keys:
        if key not in doc:
            errors.append(f"{label}: clé obligatoire manquante -> {key}")


def check_file(path: pathlib.Path, required_keys) -> None:
    if not path.is_file():
        errors.append(f"fichier absent -> {path.relative_to(ROOT)}")
        return

    try:
        parsed = list(yaml.safe_load_all(path.read_text(encoding="utf-8")))
    except yaml.YAMLError as error:
        errors.append(f"{path.relative_to(ROOT)}: YAML invalide -> {error}")
        return

    for index, doc in enumerate(parsed, start=1):
        if doc is not None:
            check_document(path, doc, index, required_keys)


def check_directory(directory: pathlib.Path, required_keys) -> None:
    if not directory.is_dir():
        errors.append(f"répertoire absent -> {directory.relative_to(ROOT)}")
        return

    for path in sorted(directory.glob("*.y*ml")):
        try:
            parsed = list(yaml.safe_load_all(path.read_text(encoding="utf-8")))
        except yaml.YAMLError as error:
            errors.append(f"{path.relative_to(ROOT)}: YAML invalide -> {error}")
            continue

        for index, doc in enumerate(parsed, start=1):
            if doc is not None:
                check_document(path, doc, index, required_keys)


for target, required_keys in DIRECTORIES:
    check_directory(target, required_keys)

for target, required_keys in FILES:
    check_file(target, required_keys)

if errors:
    print(f"{len(errors)} problème(s) détecté(s) :\n")
    for error in errors:
        print(f"  - {error}")
    sys.exit(1)

print(f"{documents} document(s) YAML valide(s).")