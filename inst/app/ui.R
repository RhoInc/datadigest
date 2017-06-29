ui <- fluidPage(
  
  titlePanel("Codebook Shiny App"), 
  sidebarLayout(
    sidebarPanel(
      width = 3,
      selectInput("data", NULL, choices=c("Select a dataset", "Data upload")),
      conditionalPanel(
        condition = "input.data=='Data upload'",
        fileInput('datafile','Upload a file',accept = c('.sas7bdat','.csv'))
      ),
      selectInput("type","Select codebook type", choices=c("Interactive","Static")), 
      downloadButton("dl","Download codebook")
    ),
    mainPanel(
      conditionalPanel(
        condition = "input.type=='Interactive'",
        codebookOutput("cbk_int")
      ),
      conditionalPanel(
        condition = "input.type=='Static'",
        uiOutput("cbk_sta")
      )
    ) 
  )
)
