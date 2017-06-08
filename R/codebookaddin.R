ui <- miniPage(
  
  miniTitleBar(a(href="https://github.com/RhoInc/webcodebook", "Interactive Codebook Add-in")),
                 # left = miniTitleBarCancelButton("cancel","Cancel"),
                 # right = miniTitleBarButton("done","Done")),
  miniTabstripPanel(
    miniTabPanel("Interactive", id = "int", icon = icon("hand-pointer-o"),
                 miniContentPanel(
                   fillCol(
                     flex=c(1,6),
                     fillRow(
                       selectInput("data1", NULL, choices=c("Select a dataset")), 
                       downloadButton("dl1","Download codebook")
                     ),
                     codebook::codebookOutput("cbk_int")
                   ))
    ),
    miniTabPanel("Static", id = "static", icon = icon("paperclip"),
                 miniContentPanel(
                   fillCol(
                     flex=c(1,6),
                     fillRow(
                       selectInput("data2", NULL, choices=c("Select a dataset")), 
                       downloadButton("dl2","Download codebook")
                     ),
                     uiOutput("cbk_sta")
                   ))
    )
  )
)



server <- function(input, output, session){
  
  
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
  
  output$cbk_int <- codebook::renderCodebook({
    req(!is.null(data_choice1()))
    codebook::codebook(data=data_choice1())
  })
  
  
  output$cbk_sta <- renderUI({
    req(!is.null(data_choice2()))
    Hmisc::html(Hmisc::describe(data_choice2()))
    
  })
  
  output$dl1 <- downloadHandler(
    filename = function() {
      paste("cbk-", input$data1, "-", Sys.Date(), ".html", sep="")
    },
    content = function(file) {
      htmlwidgets::saveWidget(codebook(data=data_choice1()), file = file)
    }
  )
  
  output$dl2 <- downloadHandler(
    filename = function() {
      paste("cbk-", input$data2, "-", Sys.Date(), ".html", sep="")
    },
    content = function(file) {
      htmltools::save_html(Hmisc::html(Hmisc::describe(data_choice2(), descript=input$data2)), file = file)
    }
  )
  
  
  # observeEvent(input$cancel, {
  #   stopApp()
  # })
  # observeEvent(input$done, {
  #   stopApp()
  # })
}


#' Codebook RStudio Add-in
#' @import shiny
#' @import miniUI
#' @import htmltools
#' @importFrom Hmisc html describe
#' 
#' @return
#' @export
codebookaddin <- function(){
  runGadget(ui, server, viewer = browserViewer(browser = getOption("browser")))
}


#' Codebook Shiny App
#' @import shiny
#' @import miniUI
#' @import htmltools
#' @importFrom Hmisc html describe
#' 
#' @return
#' @export
codebookapp <- function(){
  shinyApp(ui, server)
}
