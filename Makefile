install:
	docker-compose up -d \
	&& docker-compose exec webserver symfony composer install --no-dev --prefer-dist --optimize-autoloader \
	&& docker-compose exec webserver composer clear-cache \
	&& docker-compose exec webserver symfony console doctrine:migrations:migrate

