import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrl: './error.component.css',
})
export class ErrorComponent implements OnInit {
  errorMessage = '';

  code!: number;
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
  ) {}

  ngOnInit() {
  this.code = Number(this.route.snapshot.paramMap.get('code'));

    switch (this.code) {
      case 401:
        this.message = 'Non autorisé - vous devez être connecté.';
        break;
      case 403:
        this.message = 'Accès refusé - vous ne pouvez pas accéder à cette page.';
        break;
      case 404:
        this.message = 'Page introuvable - la page demandée n’existe pas.';
        break;
      case 500:
        this.message = 'Erreur serveur - une erreur est survenue de notre côté.';
        break;
      default:
        this.message = 'Une erreur inattendue est survenue.';
        break;
    }
  }

  goBack() {
    this.location.back();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goLogin() {
    this.router.navigate(['/login']);
  }

  reloadPage() {
    window.location.reload();
  }


}
