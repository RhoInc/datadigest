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
explorer <- function(dataList=c(), addEnv=F, demo=F) {
  # (1) Initialize the settings with the raw values passed to the r function
  rSettings = list(
    rParams=list(
      dataList = dataList,
      addEnv = addEnv
    ),
    settings = list(
        files=list(),
        meta=list(),
        labelCol="File"
    )
  )

  formatFileList<-function(fileList){
    fileList_formatted = list()
    i<-1
    for(f in fileList){
      df<-get(f)
      if(class(df)=="data.frame"){
        fileObj = list(
          File=f,
          Rows = dim(df)[1],
          Columns = dim(df)[2],
          json = jsonlite::toJSON(df)
        )
        fileList_formatted[[i]]<-fileObj
        i<-i+1
      }
    }
    return(fileList_formatted)
  }

  # (2) Prep an array of objects for the user-specified files  (if length(dataArray)>0)
  data_list_formatted <- formatFileList(dataList)

  # (3) Prep an array of objects for the environment files (if addEnv=T)
  env_list <- ls(pos=1)[sapply(ls(pos=1), function(x) class(get(x))) == 'data.frame']
  env_list_formatted <- formatFileList(env_list)


  # (4) load 20 datasets and put them in the environment
  demo_list = ls("package:datasets")[sapply(ls(pos=1), function(x) class(get(x))) == 'data.frame']
  print(demo_list)
  demo_list_formatted <- formatFileList(demo_list)
  for(f in demo_list){
    rm(f) #TODO check against pre-existing namespace
  }

  # (4) Create the final object to pass to js
  rSettings[["settings"]][["files"]] = demo_list_formatted

  # create widget
  htmlwidgets::createWidget(
    name = 'explorer',
    rSettings,
    package = 'codebook'
  )
}
