#' Create an interactive codebook
#'
#' This function creates an interactive codebook using R htmlwidgets.
#'
#' @param data  A data frame.
#'
#' @examples
#' codebook(data=mtcars)
#'
#' @import htmlwidgets
#'
#' @export
codebook <- function(data) {

  # forward options using x
  x = list(
    data=data
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'codebook',
    x,
    package = 'codebook'
  )
}

#' Shiny bindings for codebook
#'
#' Output and render functions for using codebook within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a codebook
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name codebook-shiny
#'
#' @export
codebookOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'codebook', width, height, package = 'codebook')
}

#' @rdname codebook-shiny
#' @export
renderCodebook <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, codebookOutput, env, quoted = TRUE)
}
