import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-pagamento-pix',
  templateUrl: './pagamento-pix.page.html',
  styleUrls: ['./pagamento-pix.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class PagamentoPixPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
