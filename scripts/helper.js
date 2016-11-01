

// adding a new method to prototype
 Element.addMethods({
   removeAllChildElement: function(elm){
     var elm = $(elm)
     elm.descendants().each(function(e){
       Event.stopObserving(e)
     })
     return elm.update()
   }
 })



var actionDispatcher = Class.create({
  initialize: function(config, state){
    this.config = config
    this.state = state
  },

  updateInfoHeading: function(text){
    d3.select("#DiagramInfoHeading").text(text)
  },

  updateInfoSubHeading: function(text){
    if(Array.isArray(text)){
      d3.select("#DiagramInfoSubHeading").text(text.join("\n"))
    }
    d3.select("#DiagramInfoSubHeading").text(text)
  },



  updateInfoDetailsList: function(linkContent){
    $("infoDetailsTable").removeAllChildElement()
    d3.select("#infoDetailsTable").selectAll(".infoDetailsTableItem")
        .data(linkContent)
      .enter().append("tr")
        .attr("class", "infoDetailsTableItem")
      .append("th")
        .text(function(d){return d.text})
  },

  liftToTop: function(elem){
    plane = elem.parentNode
    plane.appendChild(elem)
  },

  toggleCell: function(selection){
    // change cell color by css class
    var cellSelection = d3.select(selection)
    cellSelection.classed("cell-mouse-over", !cellSelection.classed("cell-mouse-over"))
  },

  toggleRow: function(rowNum){
    // highlight row text
    d3.selectAll(".matrix-row")
      .filter(function(d, i){ return rowNum === i})
      .classed("row-active", function(d, i) {
      return !d3.select(this).classed("row-active")
    })
    // highlight background
    d3.selectAll(".matrix-row-background")
      .filter(function(d){ return rowNum === d.x})
      .classed("row-background-active", function(d, i){
      return !d3.select(this).classed("row-background-active")
    })
  },


  toggleMultipleRow: function(keyPool){
    d3.selectAll(".matrix-row").each(function(d, i){
      var elm = d3.select(this)
      var elmBackground = d3.select(elm.node().firstChild)
      if (keyPool.indexOf(d.data.key) !== -1){
        elm.classed("row-active", !elm.classed("row-active"))
        elmBackground.classed("row-background-active", !elmBackground.classed("row-background-active"))
      }
    })
  },

  toggleColumn: function(colNum){
    var col = d3.selectAll(".matrix-column")
      .filter(function(d, i){return colNum === i})
      .classed("column-active", function(d){
        return !d3.select(this).classed("column-active")
      })
    this.toggleColText(col.node().getElementsByClassName("matrix-column-text")[0])
  },

  toggleColText: function(elm){
    var config = this.config
    d3.select(elm).attr("fill", function(d){
      var highlightColor = d.data.type && (config.color.highlight[d.data.type] || "lightgrey")
      var defaultColor = d.data.type && (config.color.default[d.data.type] || "lightgrey")
      var highlight = d3.select(this).attr("fill") === defaultColor ? true: false

      if(highlight){
        return highlightColor
      }
      return defaultColor
    })
  },

  toggleMultipleCol: function(keyPool){
    var self = this
    var config = this.config

    d3.selectAll(".matrix-column").each(function(c, j){
      var elm = d3.select(this)
      var elmText = elm.node().getElementsByClassName("matrix-column-text")[0]
      if (keyPool.indexOf(c.data.key) !== -1){
        elm.classed("column-active", !elm.classed("column-active"))
        self.toggleColText(elmText)
      }
    })
  },

  toggleTooltip: function(selection){
    var tooltipSelection = d3.select(selection)
    tooltipSelection.classed("tooltips-active", !tooltipSelection.classed("tooltips-active"))
  },

  // re-sort .matrix-row to restore rect element order
  sortRows: function(){
    var self = this
    // convert NodeList > Array
    var matrixRows = Array.prototype.slice.call(d3.selectAll(".matrix-row")._groups[0])

    // sort based on transform.translateX
    matrixRows.sort(function(a, b){
      var test = /.*\,(.+)\).*/
      return a.getAttribute("transform").match(test)[1] - b.getAttribute("transform").match(test)[1]
    })

    // apply order to this.state.svg
    matrixRows.each(function(n){
      self.liftToTop(n)
    })
  }

})



/**
 * Term Class
 */

var Term = Class.create({

  initialize: function(key, text, link){
    this.key = key
    this.text = text
    this.link = link // type [String]
    this.linkContent = new Array() // [term]
  },

  print: function(){
    console.log(this.key + ' : ' + this.text)
  },

  hasKey: function(k){
    return this.key === k
  },

  populateWith: function(otherTerm){
    // @param otherTerm: array of term object to choose from
    this.link.each(function(l){
      var filtered = otherTerm.filter(function(s){ return s.key === l })
      this.linkContent = this.linkContent.concat(filtered)
    }, this)
  },

  getKey: function(){
    return this.key
  },

  getText: function(){
    return this.text
  },

})


var Symptom = Class.create(Term, {
  // set type to symptom or not_symptom or free_symptom
  setType: function(type){
    if(type === "symptom" || "not_symptom" || "free_symptom"){
      this.type = type
    } else {
      alert("incoming symptom type not right")
    }
  },
  // set disabled property to symptom
  setDisabled: function(disabled){
    if(disabled){
      this.disabled = disabled || true
    } else {
      this.disabled = disabled || false
    }
  },

  getText: function(){
    if(this.type === "not_symptom"){
      return "NO " + this.text
    }
    return this.text
  }
})
var Disorder = Class.create(Term, {
  getKey: function(){
    var a = this.text.split(/[ ,]+/)
    if(a[0]){
      return a[0]
    }
  },
  // get text without the key at the front
  getShortText: function(){
    var a = this.text.split(/[ ,]+/)
    if(a[1]){
      return a.slice(1).join(" ")
    }
    return
  }
})


/**
 * Matrix Class
 */

var Matrix = Class.create({
  initialize: function(){
    this.grid = new Array()
  },

  addRow: function(arr){
    this.grid.push(arr)
    return this.grid[this.grid.length-1]
  }
})

/**
 * Data Handler Class
 */

var dataHandler = Class.create({
  initialize: function(inputData, config, state){
    this.config = config
    this.state = state

    this.inputData = inputData
    this.procData = this.preProcess(this.inputData)
    this.completeData = JSON.parse(JSON.stringify(this.procData))
    this.popData = this.populateLinkContent(this.procData)
    this.matrix = this.toMatrix(this.popData)
  },

  //utility for sorting symptoms
  setUpOrderingBySelection: function(data, selectionFirst){
    var config = this.config

    data.symptom.sort(function(a,b){
      if(a.hasOwnProperty("type") && b.hasOwnProperty("type")){
        return b.link.length - a.link.length;
      } else if (!a.hasOwnProperty("type") && !b.hasOwnProperty("type")) {
        return b.link.length - a.link.length;
      }
      var decision = b.hasOwnProperty("type") - a.hasOwnProperty("type")
      return selectionFirst? decision: !decision
    })
    data.symptom = data.symptom.slice(0, config.numSymptomdisplayed)
  },

  populateLinkContent: function(data){
    data.disorder.each(function(d){
      d.populateWith(data.symptom)
    })
    return data
  },



  //preprocess data into correct data structure
  preProcess: function(inputData){
    var config = this.config
    var state = this.state

    if(!state.outsideCache){console.log("cache not existent inside dataHandler Class")}
    var clientSelectedSymptom = state.outsideCache.all


    var procData = {
      "disorder": [],
      "symptom": []
    }

    // data = [{disorder}, {disorder}, ...]
    //          disorder = {key, text, {symptom}}
    //                                  symptom = {key, text}
    inputData.each(function(d){

      // populate procData.symptom
      d.symptom.each(function(s){
        // construct non duplicate array
        var idx = procData.symptom.map(function(x){return x.key;}).indexOf(s.key);
        if (idx === -1){
          // push new symptom object if not exist
          var newS = new Symptom(s.key, s.text, [d.key])

          // adding type and disabled property to new Symptom from cache [in patientsheetcode]
          if(clientSelectedSymptom.hasOwnProperty(s.key)){
            clientSelectedSymptom[s.key].type && newS.setType(clientSelectedSymptom[s.key].type)
            clientSelectedSymptom[s.key].disabled && newS.setType(clientSelectedSymptom[s.key].disabled)
          }
          procData.symptom.push(newS)
        } else {
          // add to symptom.link if exists
          procData.symptom[idx].link.push(d.key)
        }
      })

      // populate procData.disorder
      procData.disorder.push(new Disorder(d.key, d.text, d.symptom.map(function(x){return x.key;})))
    })

    return procData
  },

  // pre Process data to matrix
  toMatrix: function(data){

    // ordering of raw data
    this.setUpOrderingBySelection(data, true)

    // populate matrix
    var matrix = new Matrix()
    data.disorder.each(function(d, i){

      // construct row
      var row = matrix.addRow([])
      Object.defineProperty(row, 'data', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: d
      })
      Object.defineProperty(row, 'x', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: i
      })


      // construct cell for curr row
      data.symptom.each(function(s, j){
        row[j] = {
          x: i,
          y: j,
          z: (d.link.indexOf(s.key) != -1)? true: false
        }
        Object.defineProperty(row[j], 'data', {
          enumerable: false,
          configurable: true,
          writable: true,
          value: s
        })
      })

    })
    return matrix.grid
  }

}) // end dataHandler class
