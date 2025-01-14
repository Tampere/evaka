// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

const components = {
  asyncButton: {
    inProgress: 'Laddar',
    failure: 'Något gick fel',
    success: 'Klar'
  },
  datePicker: {
    placeholder: 'dd.mm.åååå',
    description:
      'Skriv in datumet i formatet dd.mm.åååå. Du kan komma till månadsväljaren med tabbtangenten.',
    validationErrors: {
      validDate: 'Ange i format dd.mm.åååå',
      dateTooEarly: 'Välj ett senare datum',
      dateTooLate: 'Välj ett tidigare datum'
    }
  },
  loginErrorModal: {
    header: 'Inloggningen misslyckades',
    message:
      'Autentiseringen för tjänsten misslyckades eller avbröts. För att logga in gå tillbaka och försök på nytt.',
    returnMessage: 'Gå tillbaka till inloggningen'
  },
  notifications: {
    close: 'Stäng'
  },
  offlineNotification: 'Ingen internetanslutning',
  reloadNotification: {
    title: 'En ny version av eVaka är tillgänglig',
    buttonText: 'Ladda om sidan'
  }
}

export default components
