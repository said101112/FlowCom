import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { readStorage } from '../../../core/utils/storage.util';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  @Input() isActived !: boolean ;
  @Input() isAdduser !: boolean;
  @Input() userOnline:any[]=[];
  @Output() isAdduserChange = new EventEmitter<boolean>();
  @Output() userProf=new EventEmitter<any>();
  constructor(private api:ApiService ,private router:Router){

  }
  userProfil:any={};
  ngOnInit(): void {
    const userId = readStorage('id');
    if (!userId) return;

    this.api.getUserProfile(userId).subscribe({
      next: (data) => {
        this.userProfil = data;
        this.userProf.emit(this.userProfil);
      },
      error: (err) => console.error('Erreur chargement profil', err),
    });
  } 
  logout(){
    this.api.logout().subscribe((res)=>{
      console.log(res);
      this.api.updateLastLogin(this.userProfil._id).subscribe({
              next: (res) => console.log(res.message),
              error: (err) => console.error('Erreur mise Ã  jour lastLogin', err)
            })
    this.router.navigate(['']);
    }) }
  @Input() onToggle!:()=>void;
  @Input() onProfil!:()=>void;
  

  handleProfil(){
    if(this.onProfil){
      this.onProfil();
    }
  }
  handleClick(){
    if(this.onToggle){
      console.log("isActived value :",this.isActived)
      this.onToggle();
    }
  }
  toggle(){
    this.isAdduser=true;
    this.isAdduserChange.emit(this.isAdduser);
    console.log(this.isAdduser)
}
   isNewChatActive: boolean = false;
  
  // Nouvelles variables
  globalUnreadCount: number = 3;
  currentUser: any = {
    username: 'John Doe',
    email: 'john.doe@example.com'
  };
  isDarkMode: boolean = false;
  showStarred: boolean = false;

  // Fonctions principales WhatsApp
  newChat() {
    this.isNewChatActive = !this.isNewChatActive;
    console.log('Nouvelle discussion');
    // Ouvrir modal de nouvelle conversation
  }

  createGroup() {
    console.log('CrÃ©er un nouveau groupe');
    // Ouvrir modal de crÃ©ation de groupe
  }

  addFriend() {
    console.log('Ajouter un ami');
    // Ouvrir modal d'ajout d'ami
  }

  openStatus() {
    console.log('Voir les statuts');
    // Naviguer vers la page des statuts/stories
  }

  openCalls() {
    console.log('Voir les appels');
    // Naviguer vers la page des appels
  }

  openCommunities() {
    console.log('Voir les communautÃ©s');
    // Naviguer vers les communautÃ©s
  }

  toggleStarred() {
    this.showStarred = !this.showStarred;
    console.log(this.showStarred ? 'Afficher messages importants' : 'Afficher tous les messages');
  }

  // Fonctions utilitaires
  openProfile() {
    console.log('Ouvrir le profil');
  }

  openSettings() {
    console.log('Ouvrir les paramÃ¨tres');
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    console.log('Mode', this.isDarkMode ? 'sombre' : 'clair');
  }

 

  goToDashboard() {
    console.log('Retour au dashboard');
  }




  copied = false;

copyCode() {
  const code = this.userProfil.ConnectCode;
  if (code) {
    navigator.clipboard.writeText(code).then(() => {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    });
  }
}
}
