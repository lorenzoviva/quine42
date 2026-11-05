import json
U='/home/user/quine42/lab/banco/universi-cloud/orichalcum/'
def B(g,m,chi,dove,cosa,battuta=None,indizio=None):
    b=dict(giorno=g,momento=m,chi=chi,dove=dove,cosa=cosa)
    if battuta: b['battuta']=battuta
    if indizio: b['indizio']=indizio
    return b
def Q(da,testo,tipo,ricompensa,**o): return dict(da=da,testo=testo,obiettivo=dict(tipo=tipo,**o),ricompensa=ricompensa,stato='offerta')
T=[
dict(id='dieci-ore',titolo='Le dieci ore',mistero="La Gilda dei Caldaisti vuole turni di dieci ore; la Casa Ramelli tace, e i minatori di Solfara sono pronti a scioperare con i caldaisti.",
 coinvolti=['Bruno Caldera','Quinto Sbarra','Raniero Ramelli','Gelsomina Arpa'],
 tappe=[B(0,'giorno','Bruno Caldera','Vicolo dei Caldaisti',"riunisce i caldaisti attorno alla caldaia del vicolo","Una lettera senza risposta è una risposta. Ne scriviamo un'altra, l'ultima.","la terza lettera della Gilda è ancora sigillata sulla scrivania di Raniero Ramelli"),
        B(1,'sera','Quinto Sbarra','Ingresso delle Miniere di Solfara',"conta le mani alzate dei minatori","Se si fermano le caldaie, ci fermiamo anche noi. Tutti."),
        B(2,'giorno','Raniero Ramelli','Piazza della Pesa',"stringe mani ai compratori e evita i caldaisti","Le fonderie non si fermano per una lettera."),
        B(3,'mattina','Gelsomina Arpa','Piazza della Pesa',"lascia spegnere la caldaia della Pesa per un'ora","Oggi la bilancia riposa. Chiedete a Bruno Caldera perché.")],
 missione=Q('Bruno Caldera',"Porta la voce della Gilda a Raniero Ramelli: digli che i caldaisti si fermano lunedì, se non risponde.",'parla',"un posto alla mensa della Gilda e tre soldi di rame",a='Raniero Ramelli')),
dict(id='lega-pallida',titolo='La lega pallida',mistero="La lega nuova delle Fonderie Ramelli esce più pallida e le caldaie nuove fischiano: qualcuno allunga l'oricalco con rame comune?",
 coinvolti=['Nives Caldera','Selene Vitti','Raniero Ramelli'],
 tappe=[B(0,'giorno','Nives Caldera','Fonderie Ramelli',"guarda controluce un lingotto appena colato","Questo non è il colore di mio padre. È più pallido.","i lingotti della colata di martedì hanno un marchio diverso"),
        B(1,'mattina','Selene Vitti','Bottega Vitti',"smonta un manometro della fonderia nuova","Mezza atmosfera in meno. Una caldaia così fischia, e poi un giorno non fischia più."),
        B(2,'sera','Raniero Ramelli','Magazzini Ramelli',"conta i lingotti da solo, con una candela","Nessuno deve contarli prima di me.","nei magazzini ci sono casse di rame del porto senza il bollo della dogana")],
 missione=Q('Nives Caldera',"Porta un lingotto d'oricalco a Selene Vitti: lei sa dire se la lega è giusta.",'porta',"le pinze da colata di Nives e la sua gratitudine",oggetto="Lingotto d'oricalco",a='Selene Vitti')),
dict(id='brevetto-perduto',titolo='Il brevetto perduto',mistero="Il brevetto dell'ingegner Amedeo Lenti, sparito il giorno dello scoppio, parlava di una valvola che non lascia scoppiare le caldaie. Dov'è finito?",
 coinvolti=['Corrado Ingegni','Fosca Ruggi','Amalia Vitti'],
 tappe=[B(0,'sera','Corrado Ingegni','Officine del Canale Bruma',"cerca tra vecchie carte bruciacchiate","Amedeo l'aveva disegnata. Una valvola che pensa da sola."),
        B(1,'giorno','Fosca Ruggi','Fonderia vecchia',"guarda la cassaforte annerita in fondo alla fonderia","Quella mattina Lenti è corso verso le valvole, non verso la porta.","la cassaforte della fonderia vecchia ha una combinazione di tre ruote"),
        B(2,'giorno','Amalia Vitti','Bottega Vitti',"prova a girare le ruote di un vecchio meccanismo","Tre ruote, dodici denti ciascuna. Si può fare.")],
 missione=Q('Corrado Ingegni',"Trova il brevetto dell'ingegner Lenti e portamelo: con quello nessuna caldaia scoppierà più.",'porta',"un orologio da tasca fatto con le sue mani",oggetto="Brevetto dell'ingegner Lenti",a='Corrado Ingegni')),
dict(id='rondine-bucata',titolo='La Rondine bucata',mistero="Il dirigibile di Marta Ventidue è bucato e il vento da ponente arriva tra pochi giorni; se non parte, il debito con la Casa Ramelli la schiaccia.",
 coinvolti=['Marta Ventidue','Elia Sartori','Dafne Corsi'],
 tappe=[B(0,'mattina','Marta Ventidue',"Torre d'Ormeggio di Vetta Bruna","misura lo strappo nella tela della Rondine","Due tubi di rame e un po' di fortuna, e la Rondine vola."),
        B(1,'giorno','Dafne Corsi',"Torre d'Ormeggio di Vetta Bruna","segna sul registro il cambio del vento","Ponente fra tre giorni. Non uno di più.","il registro del cielo dice che il ponente arriva il terzo giorno"),
        B(2,'sera','Elia Sartori','Piazzale degli aeronauti',"rattoppa una vela con le mani tremanti","Se la Rondine parte, Marta parte con lei.")],
 missione=Q('Marta Ventidue',"Portami un tubo di rame per il bruciatore della Rondine, prima del ponente.",'porta',"un passaggio sul dirigibile e dieci soldi di rame",oggetto='Tubo di rame',a='Marta Ventidue')),
dict(id='rame-che-sparisce',titolo='Il rame che sparisce',mistero="I cavi di rame della rimessa vengono tagliati, e al porto mancano casse sui registri; di notte passa un dirigibile senza fanali.",
 coinvolti=['Teresa Fumagalli','Nestore Binda','Zeno Marras'],
 tappe=[B(0,'mattina','Teresa Fumagalli','Rimessa delle locomotive',"trova un altro cavo tagliato dietro la rimessa","Tagliato pulito. Chi l'ha fatto conosceva la rimessa.","il taglio è fatto con le cesoie dei frenatori"),
        B(1,'sera','Nestore Binda','Banchina del rame',"parla sottovoce con un marinaio senza nome","Domani notte, stessa banchina. Lampioni spenti."),
        B(2,'notte','Zeno Marras','Porto dei Bastimenti',"conta le casse alla luce di una lanterna","Dodici in meno. Sempre dodici.","sulle casse che mancano c'era il marchio della Compagnia della Ferrovia")],
 missione=Q('Zeno Marras',"Va' alla Banchina del rame di notte e guarda chi scarica senza lampioni.",'vai',"il ringraziamento della dogana e cinque soldi di rame",luogo='Banchina del rame')),
dict(id='porta-diciassette',titolo='La porta del diciassette',mistero="Il cunicolo diciassette di Solfara finisce contro una porta di ghisa murata che sulle mappe vecchie non c'era; ora Clelia ha una chiave con un diciassette inciso.",
 coinvolti=['Teodoro Gessi','Clelia Gessi','Quinto Sbarra'],
 tappe=[B(0,'giorno','Teodoro Gessi','Ingresso delle Miniere di Solfara',"confronta una mappa vecchia con una nuova","Trent'anni fa il diciassette andava avanti. Qualcuno l'ha chiuso."),
        B(1,'mattina','Clelia Gessi','Cunicolo diciassette',"posa la mano sulla porta di ghisa, tiepida","Mio padre non lo sa ancora, ma la chiave ce l'ho io.","la serratura della porta ha la forma di un ingranaggio a dodici denti"),
        B(2,'sera','Quinto Sbarra','Ingresso delle Miniere di Solfara',"vieta ai minatori di scendere oltre il sedici","Fino a che non sappiamo cosa c'è dietro, il diciassette resta chiuso.")],
 missione=Q('Clelia Gessi',"Scendi con me nel cunicolo diciassette e aiutami ad aprire la porta di ghisa.",'vai',"la mappa dei cunicoli di mio padre",luogo='Cunicolo diciassette')),
dict(id='canto-tessitrici',titolo='Il canto delle tessitrici',mistero="Le tessitrici hanno una canzone nuova sullo sciopero, e la cantano più forte ogni giorno: la Casa Ramelli vuole sapere chi l'ha scritta.",
 coinvolti=['Ornella Battaglia','Gelsomina Arpa','Ermanno Tosi'],
 tappe=[B(0,'giorno','Ornella Battaglia','Capannone dei Telai',"comincia il canto nuovo dalla prima fila di telai","Una fila dopo l'altra, finché lo sente anche la Pesa."),
        B(1,'sera','Gelsomina Arpa','Piazza della Pesa',"canticchia il ritornello spalando carbone","Lo sa anche Ciok Ciok, ormai."),
        B(2,'mattina','Ermanno Tosi','Piazza della Pesa',"stampa il ritornello sul retro del giornale","Una canzone non si mette in prigione.","il giornale di Ermanno ha venduto il doppio da quando c'è il ritornello")],
 missione=Q('Ornella Battaglia',"Va' da Ermanno Tosi e chiedigli se stampa ancora il nostro ritornello, anche se la Casa Ramelli non vuole.",'parla',"una sciarpa tessuta al telaio grande",a='Ermanno Tosi')),
dict(id='ragazzo-volare',titolo='Il ragazzo che voleva volare',mistero="Pietro Lanzi vuole lasciare le caldaie per i dirigibili; suo zio Bruno Caldera non vuole perderlo proprio adesso che c'è lo sciopero.",
 coinvolti=['Pietro Lanzi','Bruno Caldera','Marta Ventidue'],
 tappe=[B(0,'sera','Pietro Lanzi','Vicolo dei Caldaisti',"guarda la torre d'ormeggio dal fondo del vicolo","Da lassù la fuliggine sembra una nuvola come le altre."),
        B(1,'giorno','Bruno Caldera','Vicolo dei Caldaisti',"carica il ragazzo di lavoro doppio","Prima impari il fuoco, poi il cielo."),
        B(2,'giorno','Marta Ventidue',"Torre d'Ormeggio di Vetta Bruna","cerca un mozzo per la Rondine","Mi serve qualcuno che non abbia paura del fuoco.","Marta cerca un mozzo che sappia tenere un bruciatore")],
 missione=Q('Pietro Lanzi',"Parla con Marta Ventidue per me: dille che so tenere acceso un fuoco meglio di chiunque.",'parla',"la mela più bella delle Campagne delle Trebbie",a='Marta Ventidue')),
]
for t in T: t['inizio']=0; t['stato']='attiva'
json.dump({"trame":T},open(U+'world/plots.json','w'),ensure_ascii=False,indent=2); open(U+'world/plots.json','a').write('\n')
print(len(T))
