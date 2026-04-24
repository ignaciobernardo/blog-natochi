import React from 'react';
import {
  FaBed,
  FaChalkboardTeacher,
  FaGlobeAmericas,
  FaHandshake,
  FaMicrophone,
  FaUsers,
  FaUtensils,
  FaVideo,
} from 'react-icons/fa';
import { GiMoneyStack } from 'react-icons/gi';
import { RiOpenSourceFill } from 'react-icons/ri';
import Tilt from './Tilt';
import TypewriterTitle from './TypewriterTitle';

const FeatureCard = ({ title, description, Icon, isPrimary = true }) => (
  <Tilt
    className="parallax-effect aspect-square w-[240px]"
    tiltMaxAngleX={10}
    tiltMaxAngleY={10}
    perspective={800}
    transitionSpeed={1500}
    scale={1.03}
    gyroscope={true}
  >
    <div className="h-full rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 p-4 shadow-lg">
      <div className="mb-3 text-4xl">
        <Icon
          className={`h-10 w-10 ${isPrimary ? 'text-primary' : 'text-zinc-400'}`}
        />
      </div>
      <h3
        className={`mb-2 font-bold text-lg ${isPrimary ? 'text-primary' : 'text-zinc-300'}`}
      >
        {title}
      </h3>
      <p className={`${isPrimary ? 'text-zinc-300' : 'text-zinc-400'} text-sm`}>
        {description}
      </p>
    </div>
  </Tilt>
);

const Features = () => {
  const primaryFeatures = [
    {
      title: 'mentores',
      description:
        'los mejores founders del ecosistema tech chileno te ayudarán desde el brainstorm hasta el pitch.',
      Icon: FaChalkboardTeacher,
    },
    {
      title: 'aloja aquí',
      description:
        '36 horas de hacking y probablemente un par de horas de sueño. tendremos un espacio especial para ese último par de horas.',
      Icon: FaBed,
    },
    {
      title: 'pitches',
      description:
        'en muchas hackatones se pierden buenos proyectos por malos pitches. te ayudaremos a que el pitch le haga justicia a tu proyecto.',
      Icon: FaMicrophone,
    },
    {
      title: 'chin chin',
      description:
        '1000 dólares en AWS por grupo para construir como una startup platanus.',
      Icon: GiMoneyStack,
    },
    {
      title: 'deploy it',
      description:
        'tu solución la tiene que puede usar cualquier persona del mundo. terminarás con un producto accesible públicamente.',
      Icon: FaGlobeAmericas,
    },
    {
      title: 'open source',
      description: 'todos los proyectos serán open source, licencia MIT.',
      Icon: RiOpenSourceFill,
    },
    {
      title: 'livestream',
      description:
        'los demos / pitches serán transmitidos en vivo. tu abuelita juzgará tu proyecto.',
      Icon: FaVideo,
    },
  ];

  const secondaryFeatures = [
    {
      title: 'comida',
      description:
        'suficiente comida para que sólo te preocupes en hackear y suficiente cafeína para quedar tiritando. no lo hagas.',
      Icon: FaUtensils,
    },
    {
      title: 'sponsors',
      description:
        'las mejores empresas tech estarán acá. es posible que termines con trabajo.',
      Icon: FaHandshake,
    },
    {
      title: 'networking',
      description:
        'nos enfocamos en filtrar a los mejores techies. vale la pena que los conozcas.',
      Icon: FaUsers,
    },
  ];

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-4 py-16">
      <TypewriterTitle
        text="$ diff platanus-hack other-hacks"
        className="mb-12 text-center font-bold font-oxanium text-2xl md:text-5xl"
      />
      <p className="mx-auto mb-16 max-w-3xl text-center text-xl leading-relaxed">
        tomamos elementos de las hackatones top del mundo para crear una
        hackatón de primer nivel en chile.
      </p>
      <div className="flex w-full flex-col flex-wrap items-center justify-center gap-4 lg:flex-row">
        {primaryFeatures.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
      <div className="mt-8 flex w-full flex-wrap justify-center gap-4">
        {secondaryFeatures.map((feature) => (
          <FeatureCard key={feature.title} {...feature} isPrimary={false} />
        ))}
      </div>
    </section>
  );
};

export default Features;
