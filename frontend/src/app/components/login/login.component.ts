import { Component } from '@angular/core';
import { ApiService, SignupPayload } from '../../core/services/api.service';
import { writeStorage } from '../../core/utils/storage.util';

import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {


  constructor(private api : ApiService , private router: Router){};
      isLogin = true;
      registrationData: SignupPayload = {
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  };
      formData = {
    firstName: '',
    lastName: '', 
    username: '',
    phone: '',
    email: '',
    password: ''
  };
   showResetPassword = false;
   showEmailVerification = false;
    resendVerificationEmail() {
    
  }
 onResetPassword() {
    console.log('Reset password for:', this.resetData.email);
    // Ici vous enverriez la requête de reset
    alert(`Un lien de réinitialisation a été envoyé à ${this.resetData.email}`);
    this.showResetPassword = false;
  }
 resetData = {
    email: ''
  };
  
resetForm() {
    this.formData = {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
    };
  }
data = {};
  onSubmit() {
    if (this.isLogin) {
      this.api.signin(this.formData).subscribe({
        next: (res) => {
          if (res.id) {
            writeStorage('id', res.id);
            this.router.navigate(['/chat']);
          }
        },
        error: (err) => {
          console.error('Échec de la connexion:', err.error?.error ?? err.status);
        },
      });

      return;
    }

    this.registrationData = {
      username: this.formData.username,
      firstName: this.formData.firstName,
      lastName: this.formData.lastName,
      email: this.formData.email,
      phone: this.formData.phone,
      password: this.formData.password,
    };

    this.api.signup(this.registrationData).subscribe({
      next: () => {
        this.showEmailVerification = true;
      },
      error: (err) => {
        console.error('Échec de l\'inscription:', err.error?.error ?? err.status);
      },
    });
  }

      toggleForm() {
        this.isLogin = !this.isLogin;
      }
}
