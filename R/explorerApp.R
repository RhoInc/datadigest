
#' Codebook RStudi Mini-app
#' @import shiny
#' @import miniUI
#' @import htmltools
#' @importFrom Hmisc html describe
#'
#' @export

explorerApp <- function(){
  ui = basicPage(
    includeCSS("./R/www/explorerTheme.css"),
    explorerOutput("exp_int"),
    suppressDependencies("bootstrap")
    )

  server = function(input, output, session){
    
    #Draw the explorer
    output$exp_int <- renderCodebook({
      explorer(demo=T)
    })

    #wait a second and add a file button
    Sys.sleep(1)
    insertUI(
      selector="div.explorer div.instructions.section",
      where="beforeEnd",
      ui=fileInput('datafile','Upload a file',accept = c('.sas7bdat','.csv'))
    )
  }

  #runGadget(ui, server, viewer = dialogViewer("Codebook add-in", width=1100, height=1000))
  runGadget(ui, server, viewer = browserViewer(browser = getOption("browser")))
}
