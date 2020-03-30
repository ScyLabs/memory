# Création d'une Image Docker manuellement.
#Cette image hérite de l'image publiée php:7.4.3-apache
FROM php:7.4.3-apache

# Dès l'installation on met à jour les packets et on install l'essentiel.
RUN apt-get update > /dev/null && apt-get install -y git openssh-client openssh-server zip unzip build-essential wget curl libpq-dev

# On installe ensuite les extensions  phsql / pdo_pgsql...
RUN docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql
RUN docker-php-ext-install pdo pdo_pgsql pgsql


# On installe composer / symfony / Et avec la variable d'environement pour composer, je lui autorise à lancer composer en root (puisque le container est en root)

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN wget https://get.symfony.com/cli/installer -O - | bash

RUN mv /root/.symfony/bin/symfony /usr/local/bin/symfony

# Je copie ma configuration vhost locale (./config/vhost.conf) vers le fichier template d'apache pour faire en sorte que le serveur web
# soit sur /var/www/html/public (point d'entré de SF)
ADD conf/vhost.conf /etc/apache2/sites-available/000-default.conf

# Je reconfigure apache.
RUN a2enconf

#Lancement des daemons

RUN a2enmod rewrite


#Je monte /var/www/html et je défini le répertoire de travail dans /var/www/html
VOLUME [ "/var/www/html" ]

WORKDIR /var/www/html

CMD ["apache2-foreground"]
