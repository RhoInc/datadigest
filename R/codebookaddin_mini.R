ui_mini <- miniPage(
  
  miniTitleBar(a(href="https://github.com/RhoInc/webcodebook", "Interactive Codebook Add-in"),
  left = miniTitleBarCancelButton("cancel","Cancel"),
  right = miniTitleBarButton("done","Done")),
  miniTabstripPanel(
    miniTabPanel("Interactive", id = "int", icon = icon("hand-pointer-o"),
                 miniContentPanel(
                   fillCol(
                     flex=c(1,6),
                     selectInput("data1", NULL, choices=c("Select a dataset")),
                     codebookOutput("cbk_int")
                   ))
    ),
    miniTabPanel("Static", id = "static", icon = icon("paperclip"),
                 miniContentPanel(
                   fillCol(
                     flex=c(1,6),
                     selectInput("data2", NULL, choices=c("Select a dataset")),
                     uiOutput("cbk_sta")
                   ))
    )
  )
)



server_mini <- function(input, output, session){
  
  
  # find all loaded datasets
  df <- reactiveValues(names = ls(pos=1)[sapply(ls(pos=1), function(x) class(get(x))) == 'data.frame'])
  
  # fill in select input based on datasets
  observeEvent(!is.null(df$names), {
    names <- c("Select a dataset", df$names)
    updateSelectInput(session, "data1",choices = names)
    updateSelectInput(session, "data2",choices = names)
  })
  
  observe({
    data1 <- input$data1
    updateSelectInput(session, "data2", selected = data1)
  })
  
  data_choice1 <- reactive({
    if(input$data1=="Select a dataset"){
      return(NULL)
    } else{
      return(get(input$data1))
    }
  })
  
  data_choice2 <- reactive({
    if(input$data2=="Select a dataset"){
      return(NULL)
    } else{
      return(get(input$data2))
    }
  })
  
  output$cbk_int <- renderCodebook({
    req(!is.null(data_choice1()))
    codebook(data=data_choice1())
  })
  
  
  output$cbk_sta <- renderUI({
    req(!is.null(data_choice2()))
    Hmisc::html(Hmisc::describe(data_choice2()))
    
  })

  
  observeEvent(input$cancel, {
    stopApp()
  })
  observeEvent(input$done, {
    stopApp()
  })
}


#' Codebook RStudio Add-in
#' @import shiny
#' @import miniUI
#' @import htmltools
#' @importFrom Hmisc html describe
#' 
#' @export
codebookaddin_mini <- function(){
  runGadget(ui_mini, server_mini, viewer = dialogViewer("Codebook add-in", width=1100, height=1000))
}


