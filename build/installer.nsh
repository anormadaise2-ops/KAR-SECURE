!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!ifndef BUILD_UNINSTALLER

Var KARDialog
Var KARTitle
Var KARRobot
Var KARDescription
Var KARDesktopCheckbox
Var KARStartMenuCheckbox
Var KARLaunchCheckbox
Var KARDesktopChoice
Var KARStartMenuChoice
Var KARLaunchChoice

!macro customPageAfterChangeDir
  Page custom KAROptionsCreate KAROptionsLeave
!macroend

Function KAROptionsCreate
  StrCpy $KARDesktopChoice ${BST_CHECKED}
  StrCpy $KARStartMenuChoice ${BST_CHECKED}
  StrCpy $KARLaunchChoice ${BST_UNCHECKED}

  nsDialogs::Create 1018
  Pop $KARDialog

  ${If} $KARDialog == error
    Abort
  ${EndIf}

  ; Titre de la page
  ${NSD_CreateLabel} 0 0 100% 24u "KAR SECURE  |  ZERCRAFT"
  Pop $KARTitle

  ; Assistant robot
  ${NSD_CreateLabel} 0 30u 100% 35u "ROBOT AI : ASSISTANT D'INSTALLATION"
  Pop $KARRobot

  ; Description
  ${NSD_CreateLabel} 0 68u 100% 42u "Bienvenue ! Configure KAR SECURE avant son installation. Choisis les raccourcis et indique si tu veux lancer l'application a la fin."
  Pop $KARDescription

  ; Options
  ${NSD_CreateCheckbox} 0 125u 100% 18u "Creer un raccourci sur le Bureau"
  Pop $KARDesktopCheckbox
  ${NSD_Check} $KARDesktopCheckbox

  ${NSD_CreateCheckbox} 0 153u 100% 18u "Ajouter un raccourci au menu Demarrer"
  Pop $KARStartMenuCheckbox
  ${NSD_Check} $KARStartMenuCheckbox

  ${NSD_CreateCheckbox} 0 181u 100% 18u "Lancer KAR SECURE apres l'installation"
  Pop $KARLaunchCheckbox

  ; Information transparente
  ${NSD_CreateLabel} 0 222u 100% 48u "CONFIDENTIALITE : cette page ne demande aucun mot de passe. Les fonctionnalites necessitant des droits Windows peuvent demander une autorisation separee."
  Pop $0

  nsDialogs::Show
FunctionEnd

Function KAROptionsLeave
  ${NSD_GetState} $KARDesktopCheckbox $KARDesktopChoice
  ${NSD_GetState} $KARStartMenuCheckbox $KARStartMenuChoice
  ${NSD_GetState} $KARLaunchCheckbox $KARLaunchChoice
FunctionEnd

!endif

!macro customInstall
  ; Creer les raccourcis choisis
  ${If} $KARDesktopChoice == ${BST_CHECKED}
    CreateShortCut "$DESKTOP\KAR SECURE.lnk" "$INSTDIR\KAR SECURE.exe"
  ${EndIf}

  ${If} $KARStartMenuChoice == ${BST_CHECKED}
    CreateDirectory "$SMPROGRAMS\KAR SECURE"
    CreateShortCut "$SMPROGRAMS\KAR SECURE\KAR SECURE.lnk" "$INSTDIR\KAR SECURE.exe"
  ${EndIf}

  ; Lancer l'application uniquement si l'utilisateur l'a choisi
  ${If} $KARLaunchChoice == ${BST_CHECKED}
    ExecShell "" "$INSTDIR\KAR SECURE.exe"
  ${EndIf}
!macroend

!macro customUnInstall
  Delete "$DESKTOP\KAR SECURE.lnk"
  Delete "$SMPROGRAMS\KAR SECURE\KAR SECURE.lnk"
  RMDir "$SMPROGRAMS\KAR SECURE"
!macroend
