"""Validation hors-ligne des manifests Kubernetes et du workflow CI.

Verifie que chaque document est un YAML valide, que `apiVersion`/`kind` sont
presents, et que le kustomization reference des fichiers existants.

Usage : python scripts/validate-manifests.py
"""

import pathlib
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent

# `apiVersion` / `kind` n'ont de sens que pour Kubernetes : les workflows
# GitHub Actions utilisent d'autres clés (`on`, `jobs`).
TARGETS = [
    (ROOT / "k8s" / "base", True),
    (ROOT / ".github" / "workflows", False),
]

errors = []
documents = 0


def check_directory(directory: pathlib.Path, require_k8s_keys: bool) -> None:
    global documents

    for path in sorted(directory.glob("*.y*ml")):
        try:
            parsed = list(yaml.safe_load_all(path.read_text(encoding="utf-8")))
        except yaml.YAMLError as error:
            errors.append(f"{path.relative_to(ROOT)}: YAML invalide -> {error}")
            continue

        for index, doc in enumerate(parsed, start=1):
            if doc is None:
                continue

            documents += 1
            label = f"{path.relative_to(ROOT)}#{index}"

            if not isinstance(doc, dict):
                errors.append(f"{label}: le document n'est pas un mapping")
                continue

            if not require_k8s_keys:
                continue

            for key in ("apiVersion", "kind"):
                if key not in doc:
                    errors.append(f"{label}: clé obligatoire manquante -> {key}")


def check_kustomization() -> None:
    path = ROOT / "k8s" / "base" / "kustomization.yaml"

    if not path.exists():
        errors.append("k8s/base/kustomization.yaml introuvable")
        return

    kustomization = yaml.safe_load(path.read_text(encoding="utf-8")) or {}

    for resource in kustomization.get("resources", []):
        if not (path.parent / resource).exists():
            errors.append(f"kustomization.yaml: ressource manquante -> {resource}")


for target, require_k8s_keys in TARGETS:
    if not target.is_dir():
        errors.append(f"répertoire absent -> {target.relative_to(ROOT)}")
        continue
    check_directory(target, require_k8s_keys)

check_kustomization()

if errors:
    print(f"{len(errors)} problème(s) détecté(s) :\n")
    for error in errors:
        print(f"  - {error}")
    sys.exit(1)

print(f"{documents} document(s) YAML valide(s).")
