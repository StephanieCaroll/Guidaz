import { createAnimation, AnimationBuilder } from '@ionic/angular';

export const fadeAnimation: AnimationBuilder = (_baseEl: any, opts: any) => {
  const DURACAO = 300;
  const root = createAnimation().duration(DURACAO).easing('ease-in-out');

  if (opts.enteringEl) {
    root.addAnimation(
      createAnimation()
        .addElement(opts.enteringEl)
        .beforeRemoveClass('ion-page-invisible')
        .beforeStyles({ 'z-index': '101' })
        .fromTo('opacity', '0', '1')
        .afterClearStyles(['opacity', 'z-index'])
    );
  }

  if (opts.leavingEl) {
    root.addAnimation(
      createAnimation()
        .addElement(opts.leavingEl)
        .beforeStyles({ 'z-index': '100' })
        .afterClearStyles(['z-index'])
    );
  }

  return root;
};