<?php

namespace App\Controller;

use App\Entity\Score;
use App\Form\ScoreType;
use App\Repository\ScoreRepository;
use Doctrine\ORM\EntityManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ApiController extends AbstractController
{
    /**
     * @Route("/", name="index")
     */
    public function index(ScoreRepository $scoreRepository) // Point d'entrée du jeu , la homepage.
    {
        /* 
         Notez dans les paramettres de la fonction l'utilisationd de l'autowire de symfony. 
         On récupère les scores dans un tableau avec comme keys les difficultés.
        */

        $scores = [
            "easy"      => $scoreRepository->findBy(['dificulty' =>  'easy'],[
                'time'      =>  'ASC',
            ]),
            "normal"    => $scoreRepository->findBy(['dificulty' =>  'normal'],[
                'time'      =>  'ASC',
            ]),
            "hard"      => $scoreRepository->findBy(['dificulty' =>  'hard'],[
                'time'      =>  'ASC',
                
            ])
        ];
        
    
        return $this->render('index.html.twig', [
            'scores'    =>  $scores
        ]);
    }

    /**
     * @Route("/api/start",name="start_game")
     */
    public function startGame(Request $request) // Initialisation d'une variable de session en début de jeu
    {
        $request->getSession()->set('start_game_time',time());
        return $this->json([
            'success'   =>  true
        ]);
    }
    /**
     * @Route("/api/stop",name="api_end_game")
     */
    public function endGame(Request $request) // Initialisation d'une variable de session en fin de jeu
    {
        // Si la variable de début de jeu n'existe pas c'est que la personne essaye de tricher :'D
        if(null === $startGameTime = $request->getSession()->get('start_game_time')){
            return $this->json([
                'success'    =>  false,
                'message'    =>  "Petit coquin tu essaye d'enregistrer un score sans lancer vraiment de partie ?"
            ],Response::HTTP_BAD_REQUEST);
        }

    
        $time = time() - $startGameTime;
        // Là encore il essaye de tricher , puisque le temps est dépasser et il essaye quand même d'enregistrer son score :'D
        if($time > $this->getParameter('game_max_time') ){
            return $this->json([
                'success'   =>  false,
                'message'   =>  'Tu essayes encore de tricher :o Tu envois ta requête après le temps imparti ? Pas bien !'
            ],Response::HTTP_BAD_REQUEST);
        }
        $request->getSession()->set('time_score',$time);
        return $this->json([
            'success'   =>  true,
        ]);
    }

    /**
     * @Route("/api/scores",name="api_scores")
     */
    public function scores(ScoreRepository $scoreRepository) // Tableau des scores
    {
        $scores = [
            "easy"      => $scoreRepository->findBy(['dificulty' =>  'easy'],[
                'time'      =>  'ASC',
            ]),
            "normal"    => $scoreRepository->findBy(['dificulty' =>  'normal'],[
                'time'      =>  'ASC',
            ]),
            "hard"      => $scoreRepository->findBy(['dificulty' =>  'hard'],[
                'time'      =>  'ASC',
                
            ])
        ];
        return $this->render('api/scores.html.twig', [
            'scores'    =>  $scores
        ]); 
    }
    /**
     * @Route("/api/register-score",name="api_register_score")
     */
    public function registerScore(Request $request){ // Affichage du formulaire d'enregistrement du score + traitement

        // On initialise un nouveau objet Score et on crée le formulaire
        $score = new Score();
        $form = $this->createForm(ScoreType::class,$score); 

        // On remplis le formulaire avec la requête (vide si le formulaire n'est pas envoyé)
        $form->handleRequest($request);

        if($form->isSubmitted() && $form->isValid()){
            //Si le formulaire est envoyé et valide (contraintes)

            // Bon bah on essaye encore de m'arnaquer, les variables de sessions n'existent pas.
            if(null === $timeScore = $request->getSession()->get('time_score')){
                return $this->json([
                    'success'   =>  false,
                    'message'   =>  "Alors soit tu essayes de m'arnaquer, soit quelque chose s'est mal passé, j'ai pas ton score en session !"
                ],Response::HTTP_BAD_REQUEST);
            }

            // On récupère l'objet score dans le formulaire
            $score = $form->getData();

            // On défini le temps dans l'objet score
            $score->setTime($timeScore);
            
            $entityManager = $this->getDoctrine()->getManager();
            $entityManager->persist($score);
            $entityManager->flush(); // On envoie en BDD

            return $this->json([
                'success'   =>  true,
                'message'   =>  'Félicitations ! Ton score est enregistré. Envie de refaire une partie ?',
            ]);
        }
        return $this->render('api/register.html.twig',[
            'form'  =>  $form->createView()
        ]);
        
    }
}
