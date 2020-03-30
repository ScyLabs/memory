// Création d'un objet instanciable Game. (on pourras faire new Game)
var Game = (function (gameWrapper, opts) {

    // Ici , au lieu d'appeler this directement, on défini _self = this
    // Cette technique permet d'avoir accès à this (L'objet Game , et donc à ses variables) , dans n'importe quelle sous fonction
    // Cf : Voir plus bas dans le _self.state.cards.forEach
    var _self = this;

    // Si la variable opts n'est pas défini (pas envoyé en paramètre lors du new Game()) on lui affecte un objet vide
    if (undefined === opts)
        opts = {};

    // Variables d'états fonctionnelles pour le jeu
    // Notez l'utilisation de opts.sprite ?? 'https...' dans le fichier de configuration
    // Cette manière d'écrire veut dire : Définie moi cette variable à la valeur de opts.sprite , et si cette variable n'existe pas , définie moi là avec la valeur de base donnée a droite.
    _self.state = {
        checkInProgress: false,
        cards: [], 
        cardsLength: opts.cardsLength ?? 18, // Soit cardsLength vaut la valeur reçue lors de l'initialisation , soit il vaut 18
        sprite: opts.sprite ?? "https://static.oclock.io/challenges/tests-techniques/cards.png",
        selectedCard: null,
        maxTime: opts.maxTime ?? 180, // En secondes
        progress: null,
        progressBarInterval: null,
        validPairsLength: null,
        gameStartTime: null, 
        gameEndTime: null 
    };

    // La DIV envoyée lors de l'initialisation contenant le jeu
    _self.gameWrapper = gameWrapper
    // La DIV générer par le jeu pour contenir les cartes
    var cardsWrapper = null;
    var mask = _self.gameWrapper.find('.mask');

    // Ici on fait une initialisation de base , pour générer le nombres de cartes par rapport à cardsLength (histoire qu'on ai un aperçu du jeu avant de commencer)
    init();

    //On initialise les actions de lancement de jeu dans le masque qui s'affiche avant de commencer à jouer.
    _self.gameWrapper.find('.mask').on('click', '.btn', function () {
        // On défini le nombre de cartes par rapport à la difficulté selectionnée
        _self.state.cardsLength = $(this).data('cards')
        // On défini la dificulté dans le wrapper
        _self.gameWrapper.attr('data-dificulty', $(this).data('dificulty'));
        // On enlève le masque
        $(this).parents('.mask').slideToggle(500);
        // On lance la partie ;)
        _self.start();
    })


    /* 
      On utilise l'image de sprite pour générer les cartes, du coup on crée un décalage dans l'image, par rapport à l'ID de l'image (CF plus bas)
      Du coup , vu que les sprites sont carréés, on crée ce décallage avec un transform par rapport à la largeur
      Ce qui implique de devoir recadrer a chaque resize.
    */
    $(window).on('resize', function () {
        cardsWrapper.find('.card').each(function () {
            var card = $(this);
            card.find('img').css('transform', 'matrix(1,0,0,1,0,-' + card.data('id') * card.width() + ')')
        })
    })

    // Intitialisation / réinitialisation des variables & création des cartouches
    function init() {
        
        _self.validPairsLength = 0;
        _self.state.progress = 0;
        
        // On remove le card_wrapper s'il existe
        _self.gameWrapper.find('#cards-wrapper').remove();

        // On crée un nouveau cardsWrapper
        cardsWrapper = $('<div></div>').attr('id', 'cards-wrapper');

        //On initialise le onClick des cards qui ne sont pas actives (donc pas retournées)
        cardsWrapper.on('click', '.card:not(.active)', cardOnClickHandler);
        // On l'insère après le after
        _self.gameWrapper.find('header').after(cardsWrapper);

        // On ajoute 2 fois plus de cartes que de paires (Logique)
        for (var i = 0; i < _self.state.cardsLength * 2; i++) {
            cardsWrapper.append($('<div>').addClass('card'));
        }

    }


    // Fonction de lancement du jeu avec toutes les initialisations nécessaires au bon fonctionnement de ce dernier.
    _self.start = function () {
        //  On init tout avcant de jouer ;)
        init();
        _self.state.gameStartTime = Date.now();

        /**
         * MaxTime est en secondes . (180secondes de base), setInterval récupère des millisecondes
         * Cependant, la progressBar va de 1 à 1000.
         * Pour avoir 1000 occurences de cet interval afin de remplir la progressBar, il suffis d'envoyer la valeur en s
         * On a donc un interval de 180ms qui va être cour-circuité à 180.000ms soit 180s
         */
        _self.state.progressBarInterval = setInterval(incrementProgressBar, _self.state.maxTime) 
        
        // On génère les cartes
        generateCards();
        // On dit à l'API qu'on commence la partie (c'est PHP qui gèrera le temps)
        $.ajax({
            url: _self.gameWrapper.data('startaction')
        })
    }

    // CallBack de al toolbar
    function incrementProgressBar() {

       // Pour que la progressBar soit fluide , elle va de 0 à 1000 au lieu de 0 à 100, d'où la division par 10
        _self.gameWrapper.find('.progress .bar').css('width', (_self.state.progress++) / 10 + '%');

        // Si state_progress > 1000 après l'incrémentation , on supprime l'intervale et on apelle le callback de loose.
        if (_self.state.progress > 1000) {
            clearInterval(_self.state.progressBarInterval);
            looseGameCalBack();
        }
    }

    //CallBack de loose.
    function looseGameCalBack() {

        mask.slideToggle(500);
        mask.find('.title').text('Dommage, Tu as perdu :(');
        mask.find('.text').text('Retente ta chance. Sélectionne une dificulté.');

    }

    function winGameCallBack() {
        // La partie est fini on initialise date en js pour l'afficher.
        _self.state.gameEndTime = Date.now()
        // On préviens PHP qu'on a fini de jouer
        $.ajax({
            url: _self.gameWrapper.data('endaction')
        });

        mask.slideToggle(500);
    
        // Le temps en secondes , correspond au temps de fin - le temps d'arrivé / 1000 (car Date nous renvoie un temps en ms)
        var score = Math.floor((_self.state.gameEndTime - _self.state.gameStartTime) / 1000);

        // On informe le joueur qu'il a gagné , et lui donne son score.
        mask.find('.title').text('Félicitations, tu as gagné en : ' + score + 's');
        mask.find('.text').text('Enregistre ton score : ');
        mask.find('.actions').slideToggle(500);

        /* 
          Petite requête ajax pour récupérer le formulaire
          J'aurais pu créer le formulaire directement en JS , cependant il n'y aurait pas de gestion de la faille crsf
          C'est pour cela et d'autres raisons ("Les contraintes" par exemple) que j'ai opté pour un formulaire symfony.
          D'où la requête ajax.
        */
        var form = $.ajax({
            url: _self.gameWrapper.data('registeraction'),// URL de récupération et traitement du formulaire
            success: function (result) {
                //On insère le formulaire dans le texte du masque.
                mask.find('.text').append(result);
                // On envoie la difficulté dans l'input hidden #score_dificulty , pour remplir le formulaire
                // Notez l'utilisation de object.attr('data-dificulty') au lieu de .data('dificulty') , JQuery me gardait en cache une ancienne version de l'objet...
                mask.find('.text').find('#score_dificulty').val(_self.gameWrapper.attr('data-dificulty'));
                
                
                mask.find('.text').find('form').on('submit', function (e) {
                    //  On désactive la possibilité d'envoyer
                    $(this).find('button').attr('disabled',true);
                    // On cour-circuite l'envoi du formulaire
                    e.preventDefault();
                    // Objet permettant de créer de façon aisée un ensemble clé/valeurs correspondant au formulaire, sans avoir à se le taper à la main
                    var formData = new FormData(this);

                    // Encore une requête ajax, cette fois si , pour envoyer le formulaire (Et oui , on a court-circuiter le submit)
                    $.ajax({

                        url: _self.gameWrapper.data('registeraction'), // On récupère l'url dans le gameWrapper (car générées avec le router)
                        type: 'POST',
                        data: formData,
                        contentType: false, // Ces deux options vont de paire avec le formData
                        processData: false,
                        success: function (result) {

                            // On met à jour le texte avec celui réceptionné dans le résultat JSON du formulaire
                            mask.find('.text').text(result.message);
                            mask.find('.actions').slideToggle(500);
                            
                            /*
                              Et la dernière requête ajax , qui permet , de façon très simple de récupérer le tableau de scores dans l'API.
                            */

                            /* 
                            /!\ Alors oui , il y a pas mal de requêtes ajax, dans des callBack,
                              C'est bien dans notre cas actuel car c'est un petit jeu destiné à être utilisé par une personne.
                              Cependant , pour un projet avec la possibiltié de recevoir énormément de trafic, il faudra éviter au maximum les requêtes futiles.
                              On aurait très bien pu rajouter notre ligne directement dans le tableau. 
                              Mais pour simplifier dans ce cas , j'ai fait comme ça.
                            */

                            $.ajax({
                                url: _self.gameWrapper.data('scores'),
                                success: function (result) {
                                    _self.gameWrapper.find('.scores').remove();
                                    _self.gameWrapper.find('.mask').before(result);
                                }
                            })

                        }
                    })
                })
            }
        })

        // On coupe l'intervale.
        clearInterval(_self.state.progressBarInterval);


    }


    // Event déclanché au clic d'une carte
    function cardOnClickHandler(e) {
        // Si une vérification est en cours , on court-circuite la fonction pour pas qu'elle éxécute le reste
        if (_self.state.checkInProgress)
            return;


        var sel = $(this);
        // On affiche la carte sur laquelle on vient de cliquer.
        sel.addClass('active');


        /*
          Si aucune carte n'a été cliquée au préalable (premier clic d'une série de 2 clics) on défini _self.state.selectedCard comme la carte actuelle
          Et on court-circuite la fonction
        */
        if (null === _self.state.selectedCard) {
            _self.state.selectedCard = $(this);
            return;
        }
        // Ici , on est sur notre deuxième carte, il faut donc effectuer une vérification. On bloc le clic sur toutes les cartes.
        _self.state.checkInProgress = true;

        var oldSelectedCard = _self.state.selectedCard;

        /*
        On met un delai entre le clic et la vérification pour éviter le SPAM clic
        Ca permet aussi à toutes les animations de se faire entièrement avant vérification.
        */
        setTimeout(function () {
            // On considère ici que la vérification est faite. Le délai d'éxécution des lignes en dessous etant négligeable.
            _self.state.checkInProgress = false;

            /*
              Pour faire ce test, j'aurais pu simplement mettre un data-id dans mon élément, et lors du clic comparer ces deux ids.active
              Cependant , avec cette technique, on pourrais facilement tricher en modifiant le data-id d'un élément pour les faire coincider.active
              En vérité, ce n'est pas forcément indispensable de prendre en compte ceci.
              Mais pour aller plus loin et proposer une technique intéressante, on peut comme ci-dessous comparé les deux chaînes de carractères crées avec JSON.stringify (qui transform les objets JS en string JSON)
              pour savoir si les deux cartes sont bien identiques (par rapport au nth-child de ces dernières et leurs positions dans le tableau.)
              D'où ce choix.
            */
            if (JSON.stringify(_self.state.cards[sel.index()]) !== JSON.stringify(_self.state.cards[oldSelectedCard.index()])) {
                sel.removeClass('active');
                oldSelectedCard.removeClass('active');
                refreshSelectedCard();
                return;
            }

            /*
              Si on arrive là, c'est qu'on a sélectionné les 2 bonnes cartes, puisque tous les testes du dessus court-circuitent la fonction
              On valide donc les deux cartes et on réinitialise la variable selectedCard
             */
            validateCard(sel.index());
            validateCard(oldSelectedCard.index());
            refreshSelectedCard();
            //console.log(_self.validPairsLength++,_self.state.cardsLength)

            if (_self.state.validPairsLength++ === _self.state.cardsLength - 1) {
                winGameCallBack();
                return;
            }


        }, 750)
    }


    // On remet à 0 la carte sélectionnée
    function refreshSelectedCard() {
        _self.state.selectedCard = null;
    }

    //On valide la carte en changant son état
    function validateCard(index) {
        _self.state.cards[index].validated = true;
    }

    // Génération des cartes
    function generateCards() {

        for (var i = 0; i < _self.state.cardsLength; i++) {

            // On créer N objet (n correspondant au nombres de cartes , cf : configuration de l'objet) , dans lequel l'id correspond à l'index dans la boucle.
            // Cet id permettra deux choses: Savoir si les deux photos sur lesquelles on clique sont les mêmes et créer le décalage dans le sprite pour afficher le bon fruit.
            _self.state.cards.push({
                id: i,
                visible: false,
                validated: false
            });
        }


        // Ici je concat le tableau avec lui même afin d'avoir 2 fois chaque carte. (puisqu'on crée un jeu de Mémory).
        // J'utilise _self, j'aurais pu très bien ici utiliser this , car ici il correspond à l'objet Game, mais pour rester cohérent et pour que ce soit plus clair, je décide d'utiliser _self partout.

        _self.state.cards = _self.state.cards.concat(_self.state.cards);

        // On mélange le tableau
        _self.state.cards = randomizeTab(_self.state.cards);

        // On parcours le tableau pour créer vraiment les cartes cette fois-ci.
        _self.state.cards.forEach(function (element, key) {

            // Création de deux objet jQuery (une Div et une Image), on met une classe à la div et un attribut data-id (qui va permettre de savoir si on clique sur les mêmes images).
            // J'aurais très bien pu faire $('<div class="card"></div>'), mais je trouve cette version plus propre

            var card = cardsWrapper.find('.card').eq(key);
            card.attr('data-id', element.id);

            var img = $('<img>');

            // Ici, on défini le src des images avec l'URL de l'image srpite.
            // Plus haut , on a crée la variable _self pour pouvoir y accéder ici. Car this, dans le forEach n'est pas l'objet Game mais Window
            // On créer aussi le décalage dans le Sprite à l'aide de transform: matrix
            img.attr('src', _self.state.sprite).css('transform', 'matrix(1,0,0,1,0,-' + element.id * card.width() + ')');

            card.empty().append(img);

            // On ajoute la carte au cardsWrapper

        })

    }

    // Mélange le tableau
    function randomizeTab(tab) {
        var i, j, tmp;
        for (i = tab.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            tmp = tab[i];
            tab[i] = tab[j];
            tab[j] = tmp;
        }
        return tab;
    }
});