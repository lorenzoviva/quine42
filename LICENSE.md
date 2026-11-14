# Licenza / License — QUINE42

Copyright (c) 2026 Lorenzo Vaccaro <lorenzo.vaccaro@hotmail.com>

Required Notice: Copyright 2026 Lorenzo Vaccaro (https://github.com/lorenzoviva/quine42)

Questo file contiene, in quest'ordine: chi copre che cosa, due sintesi non vincolanti (italiano e inglese), il testo di
**PolyForm Noncommercial 1.0.0** alla lettera (§ 1), i **permessi aggiuntivi** del titolare (§ 2), la licenza **CC BY-NC-SA 4.0**
dei contenuti (§ 3) e il materiale di terzi (§ 4).

This file contains, in order: what covers what, two non-binding summaries (Italian and English), the verbatim text of
**PolyForm Noncommercial 1.0.0** (§ 1), the licensor's **additional permissions** (§ 2), the **CC BY-NC-SA 4.0** license for the
content (§ 3) and third-party material (§ 4).

## Cosa copre cosa / What covers what

| Parte / Part | Licenza / License |
|---|---|
| Il codice: tutto ciò che non è elencato sotto, compresi i `logic.lua` di `universe/modules/` / The code: everything not listed below, including the `logic.lua` files in `universe/modules/` | PolyForm Noncommercial 1.0.0 (§ 1) + permessi aggiuntivi / additional permissions (§ 2) |
| I contenuti: `universe/world/`, `universe/models/`, `universe/prompts/`, `universe/universe.json`, i `manifest.json` di `universe/modules/`, `docs/` / The content: the same paths | CC BY-NC-SA 4.0 (§ 3) + permessi aggiuntivi / additional permissions (§ 2) |
| `lab/mjx/official/` (modelli e risorse di MarkovJunior / MarkovJunior models and resources) | MIT, © 2022 Maxim Gumin: vedi / see [`NOTICE.md`](NOTICE.md) (§ 4) |
| Le dipendenze in `node_modules/` / Dependencies in `node_modules/` | Ognuna la sua / Each its own |

Le versioni di QUINE42 già pubblicate restano disponibili con i termini con cui sono uscite. /
Versions of QUINE42 already published remain available under the terms they were released with.

---

## 🇮🇹 Sintesi in linguaggio chiaro (non vincolante)

Questa sintesi non sostituisce i testi delle §§ 1-3, che sono i soli vincolanti.

QUINE42 è **source-available e non commerciale**: il codice è sotto **PolyForm Noncommercial 1.0.0**, i contenuti (mondo, narrativa,
modelli MarkovJunior, documentazione) sotto **CC BY-NC-SA 4.0**, e il titolare aggiunge un permesso esplicito per ospitare il gioco
gratis.

### Cosa puoi fare
- Leggere, studiare ed esaminare tutto il codice e l'architettura.
- Clonare il repository, compilarlo ed eseguire il gioco sul tuo computer con la tua chiave IA (Google Gemini o altro fornitore che il
  gioco supporta).
- Modificarlo, farne fork e versioni tue, per scopi non commerciali: uso personale, studio, ricerca, hobby, divertimento privato.
- Usarlo in un'organizzazione non profit, una scuola o università, un ente di ricerca pubblico o un ente pubblico (lo dice PolyForm).
- **Ospitare il gioco in proprio, gratis**: per te, per i tuoi amici, per un gruppo o una comunità, su un tuo server o un server che
  controlli, con la tua chiave IA (o quelle dei giocatori), purché nessuno paghi per entrare o per giocare, non ci siano pubblicità,
  abbonamenti né vendita di crediti, e il tuo server non si presenti come il servizio ufficiale di QUINE42 (§ 2).
- Proporre Pull Request al progetto.

### Cosa non puoi fare
- **Nessun uso commerciale**: non puoi vendere il gioco, farlo pagare, inserirvi pubblicità o ricavarne un guadagno.
- **Nessun hosting commerciale**: non puoi offrire il gioco ospitato come servizio a pagamento, in abbonamento, con crediti in vendita,
  con pubblicità o comunque a fini di lucro. Ospitarlo **gratis** invece si può (vedi sopra).
- **Non spacciarlo per tuo**: devi lasciare le note di copyright e la licenza, e non puoi presentare una tua copia come il QUINE42
  ufficiale.

Per un uso commerciale o una deroga, scrivi all'autore.

---

## 🇬🇧 Plain English Summary (non-binding)

This summary does not replace the texts in §§ 1-3, which alone are binding.

QUINE42 is **source-available and noncommercial**: the code is under **PolyForm Noncommercial 1.0.0**, the content (world, lore,
MarkovJunior models, documentation) under **CC BY-NC-SA 4.0**, and the licensor adds an explicit permission to host the game for free.

### You CAN
- Read, study and inspect the whole codebase and its architecture.
- Clone the repository, build it and run the game on your machine with your own AI key (Google Gemini or another provider the game
  supports).
- Modify it, fork it and make your own versions, for noncommercial purposes: personal use, study, research, hobby projects, private
  entertainment.
- Use it in a charitable organization, a school or university, a public research organization or a government institution (PolyForm
  says so).
- **Self-host the game for free**: for yourself, your friends, a group or a community, on a server you control, with your own AI key (or
  your players' keys), as long as nobody pays to get in or to play, there are no ads, subscriptions or credit sales, and your server
  does not present itself as the official QUINE42 service (§ 2).
- Submit Pull Requests to the project.

### You CANNOT
- **No commercial use**: you may not sell the game, charge for it, put ads in it or make money from it.
- **No commercial hosting**: you may not offer the hosted game as a paid service, a subscription, with credits for sale, with ads or
  otherwise for profit. Hosting it **for free** is allowed (see above).
- **No passing it off as yours**: keep the copyright notices and the license, and do not present your copy as the official QUINE42.

For commercial use or an exception, contact the author.

---

# 1. Codice sorgente / Source code: PolyForm Noncommercial License 1.0.0

Il testo che segue è quello ufficiale, senza modifiche
([fonte](https://github.com/polyformproject/polyform-licenses/blob/1.0.0/PolyForm-Noncommercial-1.0.0.md)). Il «licensor» è
Lorenzo Vaccaro; la riga `Required Notice:` è in cima a questo file. /
The following is the official text, unmodified. The licensor is Lorenzo Vaccaro; the `Required Notice:` line is at the top of this file.

# PolyForm Noncommercial License 1.0.0

<https://polyformproject.org/licenses/noncommercial/1.0.0>

## Acceptance

In order to get any license under these terms, you must agree to them as both strict obligations and conditions to all your licenses.

## Copyright License

The licensor grants you a copyright license for the software to do everything you might do with the software that would otherwise infringe the licensor's copyright in it for any permitted purpose.  However, you may only distribute the software according to [Distribution License](#distribution-license) and make changes or new works based on the software according to [Changes and New Works License](#changes-and-new-works-license).

## Distribution License

The licensor grants you an additional copyright license to distribute copies of the software.  Your license to distribute covers distributing the software with changes and new works permitted by [Changes and New Works License](#changes-and-new-works-license).

## Notices

You must ensure that anyone who gets a copy of any part of the software from you also gets a copy of these terms or the URL for them above, as well as copies of any plain-text lines beginning with `Required Notice:` that the licensor provided with the software.  For example:

> Required Notice: Copyright Yoyodyne, Inc. (http://example.com)

## Changes and New Works License

The licensor grants you an additional copyright license to make changes and new works based on the software for any permitted purpose.

## Patent License

The licensor grants you a patent license for the software that covers patent claims the licensor can license, or becomes able to license, that you would infringe by using the software.

## Noncommercial Purposes

Any noncommercial purpose is a permitted purpose.

## Personal Uses

Personal use for research, experiment, and testing for the benefit of public knowledge, personal study, private entertainment, hobby projects, amateur pursuits, or religious observance, without any anticipated commercial application, is use for a permitted purpose.

## Noncommercial Organizations

Use by any charitable organization, educational institution, public research organization, public safety or health organization, environmental protection organization, or government institution is use for a permitted purpose regardless of the source of funding or obligations resulting from the funding.

## Fair Use

You may have "fair use" rights for the software under the law. These terms do not limit them.

## No Other Rights

These terms do not allow you to sublicense or transfer any of your licenses to anyone else, or prevent the licensor from granting licenses to anyone else.  These terms do not imply any other licenses.

## Patent Defense

If you make any written claim that the software infringes or contributes to infringement of any patent, your patent license for the software granted under these terms ends immediately. If your company makes such a claim, your patent license ends immediately for work on behalf of your company.

## Violations

The first time you are notified in writing that you have violated any of these terms, or done anything with the software not covered by your licenses, your licenses can nonetheless continue if you come into full compliance with these terms, and take practical steps to correct past violations, within 32 days of receiving notice.  Otherwise, all your licenses end immediately.

## No Liability

***As far as the law allows, the software comes as is, without any warranty or condition, and the licensor will not be liable to you for any damages arising out of these terms or the use or nature of the software, under any kind of legal claim.***

## Definitions

The **licensor** is the individual or entity offering these terms, and the **software** is the software the licensor makes available under these terms.

**You** refers to the individual or entity agreeing to these terms.

**Your company** is any legal entity, sole proprietorship, or other kind of organization that you work for, plus all organizations that have control over, are under the control of, or are under common control with that organization.  **Control** means ownership of substantially all the assets of an entity, or the power to direct its management and policies by vote, contract, or otherwise.  Control can be direct or indirect.

**Your licenses** are all the licenses granted to you for the software under these terms.

**Use** means anything you do with the software requiring one of your licenses.

---

# 2. Permessi aggiuntivi / Additional permissions

Questi permessi sono dati dal titolare **in aggiunta** alle licenze delle §§ 1 e 3 e non ne cambiano il testo: chi non li usa resta
esattamente con quelle licenze. In caso di dubbio fa fede il testo inglese. /
These permissions are granted by the licensor **in addition to** the licenses in §§ 1 and 3 and do not change their text: anyone who
does not use them is left with exactly those licenses. In case of doubt the English text prevails.

## Free self-hosting

The licensor grants you permission to run the software and the content, with or without changes and new works made under these
licenses, on servers you own or control, and to let other people use them over a network (for yourself, your friends, a club, a group
or a community, publicly or privately), provided that all of the following hold:

1. **No payment.** Nobody pays, directly or indirectly, to get access, to play, to create or keep a world, or for any advantage in it:
   no fees, subscriptions, paid tiers, sales of credits or items, or required donations. Voluntary donations that unlock nothing are
   not a payment.
2. **No ads and no data monetization.** The hosted instance carries no advertising or sponsorship, and you do not sell or rent data
   about its users.
3. **Your own AI keys.** The AI services the software calls are paid with your own keys or with the keys of the players themselves,
   under the terms of those services.
4. **Notices.** Every user can reach the notices required by § 1 and § 3 (for example a link to this file), and the hosted instance
   does not present itself as the official QUINE42 service or as endorsed by the licensor.

Hosting the software in any other way, including any form of payment for access or use, is a commercial purpose and needs a separate
license from the licensor.

## Self-hosting gratuito (traduzione)

Il titolare ti permette di eseguire il software e i contenuti, così come sono o con modifiche e opere nuove fatte secondo queste licenze,
su server che possiedi o controlli, e di farli usare ad altre persone in rete (a te, ai tuoi amici, a un circolo, a un gruppo o a una
comunità, in pubblico o in privato), purché valgano tutte queste condizioni:

1. **Niente pagamenti.** Nessuno paga, direttamente o indirettamente, per entrare, giocare, creare o tenere un mondo, o per un vantaggio
   al suo interno: niente quote, abbonamenti, livelli a pagamento, vendita di crediti o di oggetti, donazioni obbligatorie. Le donazioni
   spontanee che non sbloccano niente non sono un pagamento.
2. **Niente pubblicità né vendita di dati.** L'istanza ospitata non ha pubblicità né sponsor, e non vendi né affitti i dati di chi la usa.
3. **Le tue chiavi IA.** I servizi di IA che il software chiama si pagano con le tue chiavi o con quelle dei giocatori stessi, alle
   condizioni di quei servizi.
4. **Note.** Ogni utente può raggiungere le note che chiedono la § 1 e la § 3 (per esempio un link a questo file), e l'istanza ospitata
   non si presenta come il servizio ufficiale di QUINE42 né come approvata dal titolare.

Ospitare il software in un altro modo, compresa qualunque forma di pagamento per l'accesso o l'uso, è uno scopo commerciale e richiede
una licenza a parte dal titolare.

---

# 3. Contenuti / Content: Creative Commons BY-NC-SA 4.0

I contenuti elencati in «Cosa copre cosa» sono rilasciati sotto la licenza **Creative Commons Attribution-NonCommercial-ShareAlike 4.0
International**. Il testo legale, il solo vincolante, è qui: <https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.en>
(sintesi: <https://creativecommons.org/licenses/by-nc-sa/4.0/>). /
The content listed in "What covers what" is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International**
license. The legal code, which alone is binding, is linked above.

Attribuzione richiesta / Required attribution: «QUINE42 © 2026 Lorenzo Vaccaro, CC BY-NC-SA 4.0,
https://github.com/lorenzoviva/quine42».

La sintesi di Creative Commons (non è la licenza) / The Creative Commons summary (not the license):

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in
  any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
- **NonCommercial** — You may not use the material for commercial purposes.
- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as
  the original.
- **No additional restrictions** — You may not apply legal terms or technological measures that legally restrict others from doing
  anything the license permits.

---

# 4. Materiale di terzi / Third-party material

`lab/mjx/official/` contiene modelli e risorse del repository di MarkovJunior (© 2022 Maxim Gumin, licenza MIT), che restano sotto la
loro licenza: il testo e l'elenco sono in [`NOTICE.md`](NOTICE.md). Le dipendenze in `node_modules/` hanno ciascuna la sua licenza. /
`lab/mjx/official/` contains models and resources from the MarkovJunior repository (© 2022 Maxim Gumin, MIT License), which stay under
their license: see [`NOTICE.md`](NOTICE.md). Dependencies in `node_modules/` each have their own license.
