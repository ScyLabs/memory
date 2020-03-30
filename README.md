# Memory



## Installation
Je vous ai mis en place une initialisation avec docker, si vous avez docker installé vous n'avez qu'a faire les commandes ci-dessous.

J'ai préparé un MakeFile.
Pour initialiser le projet vous n'avez qu'une chose à faire

```bash
make install
```
Si vous n'avez pas build essentials , vous pouvez lancer ces 4 commandes

```bash
docker-compose up -d
docker-compose exec webserver symfony composer install --no-dev --prefer-dist --optimize-autoloader
docker-compose exec webserver composer clear-cache 
docker-compose exec webserver symfony console doctrine:migrations:migrate
```

## Liste des fichiers importants

```bash
docker-compose.json # Composition des containers docker
Dockerfile.app # Création de l'image du container webserver
Makefile # Fichiers facilitant le déploiement (make install)
app/ # Dossier contenant tout le code source 
    srcController/ApiController.php # Controller unique du projet (API + index)
    src/Entity/Scores.php # Entité pour les scores
    src/Form/ScoresType.php # Formulaire des scores
    src/Migrations/Version20200328130757.php # Initialisation de la base de donnée avec les best pratices actuelles. (Migration doctrine)
    templates/
        index.html.twig # Template du jeu (Layout unique de base / Pas besoin d'héritage twig ici)
        api/
            register.html.twig # Formulaire d'enregitrement de sscores
            scores.html.twig # Tableau des scores
    public/
        js/
            game.js # Objet Js gérant le jeu
        css/
            game.less # style du jeu au format less
            game.css # Style du jeu compilé depuis le fichier less
conf:
    vhosts.conf # Fichier de configuration apache envoyé au container
            
```
