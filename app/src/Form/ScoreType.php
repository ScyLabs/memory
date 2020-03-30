<?php

namespace App\Form;

use App\Entity\Score;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\NotBlank;

class ScoreType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('name',TextType::class,[
                'label' =>  false,
                'attr'  =>  [
                    'placeholder'   =>  'Ton pseudo'
                ],
                'constraints'   =>  [
                    // Contrainte qui dit que le pseudo ne peut pas être vide.
                    new NotBlank()
                ]

            ])
            ->add('dificulty',HiddenType::class,[
                'constraints'   =>  [
                    new NotBlank()
                ]

            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => Score::class,
        ]);
    }
}
