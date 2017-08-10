#' Create an interactive codebook
#'
#' This function creates a series of interactive codebook using R htmlwidgets.
#'
#' @param dataArray  a list of dataframes (TODO change to tibble?).
#' @param addEnv  boolean. Indicates whether to add all data frames in current environemnt to explorer.

#'
#' @examples
#' explorer(dataArray=c(cars, iris))
#'
#' @import htmlwidgets
#'
#' @export
explorer <- function(dataList=c(), addEnv=F) {
  # (1) Initialize the settings with the raw values passed to the r function
  rSettings = list(
    rParams=list(
      dataList = dataList,
      addEnv = addEnv
    ),
    settings = list(
        files=list(),
        meta=list(),
        labelCol=""
    )
  )

  formatFileList<-function(fileList){
    
  }
  
  # (2) Prep an array of objects for the user-specified files  (if length(dataArray)>0)
  dataList_formatted <- formatFileList(dataList)
  
  # (3) Prep an array of objects for the environment files (if addEnv=T)
  env_list <- ls(pos=1)[sapply(ls(pos=1), function(x) class(get(x))) == 'data.frame']
  env_list_formatted <- formatFileList(df_list)
  
  # (4) Create the final object to pass to js

  # create widget
  htmlwidgets::createWidget(
    name = 'explorer',
    rSettings,
    package = 'codebook'
  )
}
