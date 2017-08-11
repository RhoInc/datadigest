
#' Codebook RStudi Mini-app
#' @import shiny
#' @import miniUI
#' @import htmltools
#' @importFrom Hmisc html describe
#'
#' @export

explorerApp <- function(){
  ui = miniPage(
    miniContentPanel(
      explorerOutput("exp_int")
    ),
    suppressDependencies("bootstrap")
  )

  server = function(input, output, session){
    output$exp_int <- renderCodebook({
      explorer(demo=T)
    })
    observeEvent(input$cancel, {
      stopApp()
    })
    observeEvent(input$done, {
      stopApp()
    })
  }

  runGadget(ui, server, viewer = dialogViewer("Codebook add-in", width=1100, height=1000))
  #runGadget(ui, server, viewer = browserViewer(browser = getOption("browser")))
}
