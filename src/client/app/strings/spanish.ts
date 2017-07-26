import { ClientStrings } from './index';

// Whenever there is no localized translation, use the English version.
// Whenever these two lines are not commented out, it means that there are
// still strings that need to be localized.
// Just search for "englishSubstitutesForNotYetTranslated" in this file
// import { getEnglishStrings } from './english';
// const englishSubstitutesForNotYetTranslated = getEnglishStrings();

export function getSpanishStrings(): ClientStrings {
    const playgroundName = 'Script Lab';

    return {
        playgroundName: playgroundName,
        playgroundTagline: 'Codifica ● Ejecuta ● Comparte',

        userId: 'ID de usuario',

        alpha: 'Alfa',
        beta: 'Beta',
        production: 'Producción',

        run: 'Ejecutar',
        runInThisPane: 'Ejecuta el código en este panel',
        runSideBySide: 'Ejecuta el código en un panel adyacente',
        share: 'Compartir',
        delete: 'Borrar',
        close: 'Cerrar',
        about: 'Acerca de',
        feedback: 'Retroalimentación',
        errors: 'Errores',
        dismiss: 'Ignorar',

        okButtonLabel: 'OK',
        logoutButtonLabel: 'Cerrar sesión',
        cancelButtonLabel: 'Cancelar',
        saveButtonLabel: 'Guardar',
        moreInfoButtonLabel: 'Más información',
        importButtonLabel: 'Importar',
        editorTriggerSuggestContextMenuLabel: 'Sugerir código',

        snippetImportError: 'Error al importar fragmento de código',
        snippetImportErrorTitle: 'Error en importación',
        snippetImportErrorBody: 'No pudimos importar el fragmento de código.',
        reloadPrompt: 'Vuelve a cargar este panel e intenta otro URL o ID.',

        snippetSaveError: 'Error al guardar el fragmento de código',
        snippetDupeError: 'Error al duplicar el fragmento de código',
        snippetDeleteError: 'Error al borrar el fragmento de código',
        snippetDeleteAllError: 'Error al borrar todos los fragmentos de código locales',
        snippetLoadAllError: 'Error al cargar fragmentos de código locales',
        snippetRunError: 'Error al ejecutar el fragmento de código',
        snippetLoadDefaultsError: 'Error al cargar ejemplos',

        snippetNoOfficeTitle:  'No se puede ejecutar el fragmento de código',
        snippetNoOfficeMessage:  'Sólo se pueden ejecutar fragmentos de código dentro de un Add-in para Office.  Adquiere gratuitamente Script Lab hoy en https://aka.ms/getscriptlab.',

        snippetUpdateError:  'Error al actualizar el fragmento de código',

        snippetValidationEmpty: `El fragmento de código no pude estar vacío`,
        snippetValidationNoTitle: 'El fragmento de código requiere un título',

        defaultSnippetTitle: 'Nuevo Fragmento de código',
        newSnippetTitle: 'Ejemplo' /* string gets modified at runtime */,

        //ui.ts strings:
        dialogError: 'Error en el diálogo',
        dialogOpenError: 'Un diálogo ya esta abierto',

        //monaco.ts strings:
        intellisenseUpdateError: 'Error al actualizar IntelliSense',
        intellisenseClearError: 'Error al limpiar IntelliSense',
        intellisenseLoadError: 'Error al cargar archivo con IntelliSense',

        //github.ts strings:
        githubLoginFailed: 'Error al iniciar sesión en GitHub',
        githubLogoutFailed: 'Error al cerrar sesión en  GitHub',
        profileCheckFailed: 'Error al obtener perfil de GitHub',
        gistRetrieveFailed: 'Error al obtener gists de GitHub',
        gistDescriptionAppendage: `Compartido con ${playgroundName}`,

        gistShareFailedBody:  'Error al compartir gist de GitHub',
        gistShareFailedTitle: 'Error al compartir',

        gistSharedDialogStart: 'El URL de tu gist de GitHub es:',
        gistSharedDialogEnd: `Para importar tu fragmento de código, presiona el boton Importar en ${playgroundName} y proporciona este URL.`,
        gistSharedDialogTitle: 'Comparte tu fragmento de código',
        gistSharedDialogViewButton: 'Ver en GitHub',
        gistUpdateUrlIsSameAsBefore: 'El URL de tu gist modificado no cambió',
        gistUpdateSuccess: 'Fragmento de código modificado exitosamente',

        snippetCopiedConfirmation: `Tu fragmento de código esta copiado en el clipboard`,
        snippetCopiedFailed: 'Error al copiar el fragmento de código en el clipboard',

        snippetExportFailed: 'Error al exportar fragmento de código',
        snippetExportNotSupported: 'La exportacion de fragmentos de código no esta soportada en esta versión de Office. Dicha funcionalidad esta soportada sólo en las plataformas Windows y Office Online.',

        // Components strings
        // about.ts
        aboutUpdated: 'Última actualización:',
        aboutStorage: 'Almacenamiento:',
        aboutSnippets: 'Fragmentos de código locales',
        aboutIntellisense: 'IntelliSense',
        aboutCurrentEnvironment:  'Ambiente actual:',
        aboutSwitchEnvironment: 'Cambiar de {0} a {1}:',
        changeEnvironmentConfirm:  'Está por cambiar el ambiente de Script Lab y no tendrá acceso a los fragmentos de código guardados de manera local hasta que regrese al ambiente. ¿Está seguro de proceder?',

        //snippet.info.ts
        snippetInfoDialogTitle: 'Información',
        nameLabel: 'Nombre',
        descriptionLabel: 'Descripción',
        namePlaceholder: 'Nombre del fragmento de código',
        descriptionPlaceholder: 'Descripción del fragmento de código ',
        gistUrlLabel:  'URL del gist',
        gistUrlLinkLabel:  'Abrir en navegador',

        // Containers strings
        //app.ts

        shareMenuPublic:  'Crear gist público',
        shareMenuPrivate:  'Crear gist secreto',
        updateMenu:  'Actualizar gist existente',
        sharePublicSnippetConfirm: '¿Estás seguro de compartir nuevamente este fragmento como un nuevo gist público?',
        sharePrivateSnippetConfirm: '¿Estás seguro de compartir nuevamente este fragmento como un nuevo gist secreto?',

        shareMenuClipboard: 'Copiar al clipboard',
        shareMenuExport: 'Exportar para publicación',

        loginGithub: 'Iniciar sesión en GitHub',

        lightTheme: 'Claro',
        darkTheme: 'Obscuro',

        deleteSnippetConfirm: '¿Está seguro de borrar este fragmento de código?',

        tabDisplayNames: {
            'script': 'Código ',
            'template': 'Plantilla',
            'style': 'Estilo',
            'libraries': 'Librerías'
        },

        // Gallery.view strings

        snippetsTab: 'Fragmentos de código',
        samplesTab: 'Ejemplos',

        noSnippetsMessage: 'No tienes fragmentos de código locales. Puedes ya sea crear uno, escojer un ejemplo o importar alguno.',
        noGistsMessage: `No has subido el fragmento de código a gist aún. Después de crear o modificar un fragmento de código, escoge Compartir para subirlo.`,

        newSnippetDescription: 'Crear un fragmento de código',
        importDescription: 'Crear un fragmento de código importando YAML o un gist de GitHub',

        // import.ts strings

        newSnippetLabel: 'Crear',
        mySnippetsLabel: 'Mis fragmentos',
        samplesLabel: 'Ejemplos',
        importLabel: 'Importar',
        mySnippetsDescription: 'Escoje un fragmento código previamente guardado.',
        localSnippetsLabel: 'Mis fragmentos de código en esta computadora',
        noLocalSnippets: `No has guardado fragments de código en esta computadora. Para hacerlo, crea o importa alguno.`,
        sharedGistsLabel: 'Mis gists compartidos en GitHub',
        sharedGistsSignIn: 'Inicia una sesión en Github para acceder a los fragmentos de código que has compartido ahí.',
        samplesDescription: 'Selecciona alguno de los ejemplos abajo para iniciar.',
        noSamplesMessage: `No hay ejemplos aún para esta Aplicación.`,
        importWarning: `Precaución: los ejemplos importados pueden contener código maligno. Ejecuta código sólo de fuentes confiables.`,
        importWarningAction: `No mostrar esta advertencia otra vez.`,

        localStorageWarning: `Los fragmentos de código creados localmente serán borrados si se limpia el cache del navegador. ` +
        `Para guardar fragmentos permanentemente, expórtalos como gists on el menú de Compartir.`,
        localStorageWarningAction: `No mostrar esta advertencia otra vez.`,

        importInstructions: `Proporciona el URL del fragmento de código o pega el YAML abajo, después escoje `,
        importUrlLabel: `URL del fragmento de código o ID del gist de Github`,
        importUrlPlaceholder: `ejemplo. https://gist.github.com/sampleGistId`,
        importYamlLabel: `YAML del fragmento de código`,

        Refresh: {
            /** Error if refresh URL is somehow misformed (should essentially never happen) */
            missingSnippetParameters: `Un problema de configuración previno evitó que se cargue el fragmento de código.`,

            /** Error if snippet no longer exists */
            couldNotFindTheSnippet: `No se encontró el fragmento de código. Pudo ser borrado.`,

            /** Appends one of the following to the error message
             * (navigating back after a couple of seconds, if there is a return URL) */
            getTextToAppendToErrorMessage: (returnUrl: string) =>
                returnUrl ? 'Returning...' : 'Cierra esta ventana e intenta de nuevo.'
        },

        Runner: {
            snippetNoLongerExists: 'El fragmento de código ya no existe. Recarga esta página or regresa a la anterior.',
            unexpectedError: 'Ocurrió un error inesperado',

            reloadingOfficeJs: 'Recargando Office.js',

            noSnippetIsCurrentlyOpened: `No existe un fragmento de código en el panel de edición.`,

            getLoadingSnippetSubtitle: (snippetName?: string) => {
                return 'Loading ' + (snippetName ? `"${snippetName}"` : 'fragmento de código');
            }
        },

        /** Error strings served by the server and displayed in the Error page */
        ServerError: {
            moreDetails: 'Mas detalles...',
            hideDetails: 'Esconder detalles...'
        },

        SideBySideInstructions: {
            title:  'Ejecuta el código en un panel adyacente al editor',

            message: [
                'Para ejecutar el codigo en un panel adyacente al editor, selecciona "Ejecutar" en la barra de herraminetas.',
                '',
                'Ejecutar el código en un panel adyacente al editor ofrece mayor rapidez y la ventaja de mantener tu posición e historia de deshacer en el editor.'
            ].join('\n'),

            gotIt:  'Ok'
        },

        HtmlPageStrings: {
            PageTitles: {
                code: 'Código',
                run: 'Ejecutar',
                tutorial: 'Tutorial'
            },

            chooseYourHost: 'Selecciona tu host:',

            localStorageUnavailableMessage:
            'No se puede inicializar Script Lab debido a que la configuracion de tu navegador tiene deshabilitada el almacenamiento local. ' +
            ' Por favor verifica su configuración o intenta en otro navegador o computadora.',

            loadingRunnerDotDotDot: 'Cargando ejecutor de código...',
            running: 'Ejecutando',
            lastOpenedSnippet: 'Último fragmento de código abierto',
            noLastOpenedSnippets: 'No existe un último fragmento de código abierto.',
            toGetStartedCreateOrImportSnippet: 'Para empezar, crea o importa un fragmento de código seleccionando el botton "Codigo".',
            mySavedSnippets: 'Mis fragmentos guardados',
            noLocalSnippets: 'No existen fragmentos de código locales.',
            lastUpdated: 'Última actualización',
            clickToRefresh: 'Click para actualizar',

            tutorialDescription: 'Este archivo de Excel te muestra como utilizar Script Lab en sencillos pasos:',
            download: 'Descargar',
            errorInitializingScriptLab: 'Error al iniciar Script Lab.'
        }
    };
}

