# Attribution des listes de l’échelle de mots

Les fichiers `words-4.txt` et `words-5.txt` sont l’union des formes françaises de 4 et 5 lettres extraites de :

- **Morphalou 3.1**, lexique morphologique du français moderne développé par l’ATILF/CNRS et diffusé par [ORTOLANG](https://hdl.handle.net/11403/morphalou/v3.1), sous licence **LGPL-LR**.
- **Grammalecte/Dicollecte 7.7**, [lexique des formes fléchies du français](https://www.grammalecte.net/dic/lexique-grammalecte-fr-v7.7.zip), sous licence [MPL 2.0](https://www.mozilla.org/MPL/2.0/).

Les fichiers `morphalou-4-5.txt` et `grammalecte-4-5.txt` sont les extractions respectives des lemmes et formes fléchies de quatre et cinq lettres. La liste conserve la base Morphalou déjà validée par Lexique (fréquence de forme minimale de 0,5 par million) et lui ajoute les formes Grammalecte/Dicollecte ayant un indice de fréquence d’au moins 5. Les entrées non lexicales évidentes (noms propres, abréviations et symboles) sont exclues, sans exiger qu’un ajout Grammalecte soit présent dans Lexique.

Source Morphalou utilisée : `Morphalou3.1_formatCSV_toutEnUn.zip` (SHA-256 `4FC815CBF17AECDF1B47F6BBC263489A460FD8D11AE17E6B522336C72BD0E333`).

Source Grammalecte utilisée : `lexique-grammalecte-fr-v7.7.zip` (SHA-256 `BDCCF2065E252010253171000A38DE84581407896B6BC60ACA7D4D69DAB7E4D2`).
