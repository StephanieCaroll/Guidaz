import { createAnimation, AnimationBuilder } from '@ionic/angular';

export const fadeAnimation: AnimationBuilder = (_baseEl: any, opts: any) => {
  const DURACAO = 800;
  const root = createAnimation();

  if (opts.enteringEl) {
    root.addAnimation(
      createAnimation()
        .addElement(opts.enteringEl)
        .beforeRemoveClass('ion-page-invisible')
        .duration(DURACAO)
        .easing('ease-in-out')
        .fromTo('opacity', '0', '1')
        .afterClearStyles(['opacity'])
    );
  }

  if (opts.leavingEl) {
    root.addAnimation(
      createAnimation()
        .addElement(opts.leavingEl)
        .duration(DURACAO)
        .easing('ease-in-out')
        .fromTo('opacity', '1', '0')
    );
  }

  return root;
};