

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

  updateInfoDetailsList: function(symptom){
    $("infoDetailsTable").removeAllChildElement()
    d3.select("#infoDetailsTable").selectAll(".infoDetailsTableItem")
        .data(symptom)
      .enter().append("tr")
        .attr("class", "infoDetailsTableItem")
      .append("th")
        .text(function(d){
          return d.getText() + " => " + d.category
        })
  },

  liftToTop: function(elem){
    var plane = elem.parentNode
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
    console.log(keyPool);

    d3.selectAll(".matrix-column").each(function(c, j){
      var elm = d3.select(this)
      var elmText = elm.node().getElementsByClassName("matrix-column-text")[0]
      if (keyPool.indexOf(c.data.key) !== -1){
        elm.classed("column-active", !elm.classed("column-active"))
        self.toggleColText(elmText)
      }
    })
  },

  showToolTip: function(currElem, d){

    var matrix = currElem.getScreenCTM()
          .translate(+ currElem.getAttribute("cx"), + currElem.getAttribute("cy"))

    var isDisorder = d.data.hasOwnProperty("symptom")

    var textAlignDirection = isDisorder ? "text-align-right" : "text-align-left"
    var topShiftAddition = isDisorder ? this.state.scale.y.bandwidth() : 0
    var tooltipWidth = isDisorder ? this.config.tooltip.width + "px"  : "auto"

    this.state.tooltip
      .html(function(){
        var title = "<div id='tooltipTitle' class=" + textAlignDirection + ">" + d.data.getText() + "</div>"
        return title
      })
      .transition()
      .delay(10)
      .style("left", 0)
      .style("opacity", 1)
      .style("left", (matrix.e) + "px")
      .style("top", (matrix.f + topShiftAddition) + "px")
      .style("width",function(d){
        return tooltipWidth
      })

  },

  mouseOverTracking: function(){
    this.state.tooltip
     .style("left", Math.max(0, d3.event.pageX - this.config.tooltip.width/2) + "px")
     .style("top", (d3.event.pageY - this.state.scale.x.bandwidth() * 3) + "px");
  },

  removeToolTip: function(){
    this.state.tooltip
      .transition()
      .delay(10)
      .style("opacity", 0)
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

  initialize: function(key, text){
    this.key = key
    this.text = this.capitalizeEveryWord(text)
    // this.link = link // type [String]
    // this.linkContent = new Array() // [term]
  },

  capitalizeEveryWord: function(text){
    newText = []
    var a = text.toLowerCase().split(/[ ,]+/)
    a.each(function(b){
      newText.push(b.charAt(0).toUpperCase() + b.slice(1))
    })
    return newText.join(" ")
  },

  print: function(){
    console.log(this.key + ' : ' + this.text)
  },

  toString: function(){
    return this.key + ' : ' + this.text
  },

  hasKey: function(k){
    return this.key === k
  },

  getKey: function(){
    return this.key
  },

  getText: function(){
    return this.text
  },

  equalTo: function(t){
    return this.key === t.key && this.text === t.text && typeof this === typeof t
  }

})


var Symptom = Class.create(Term, {

  initialize: function($super, key, text, type, category){
    $super(key, text)
    this.category = category
    this.type = type

    // for setting column ordering
    this.calculatePrevalence()
  },

  calculatePrevalence: function(){
    var mapping = {
      'match': 10,
      'ancestor': 1,
      'unknown': 0,
      'missmatch': -1
    }
    if (this.key in Symptom.prevalence){
      Symptom.prevalence[this.key] += mapping[this.category]
    } else {
      Symptom.prevalence[this.key] = 0
    }
  },

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
    var symText = this.text
    if(this.type === "not_symptom"){
      symText = "NO " + symText
    }

    var cutoff = 30
    if(symText.length > cutoff){
      symText = symText.slice(0, cutoff) + " ..."
    }
    return symText
  },

  toString: function($super){
    return $super() + " ("+ this.category +")"
  },

  equalTo: function($super, s){
    return $super(s) && this.type === s.type && this.category === s.category
  },

  greaterThan: function(s){
    var rule = ['missmatch' ,'unknown', 'ancestor', 'match']

    if(!this.equalTo(s)){
      var self = rule.indexOf(this.category)
      var other = rule.indexOf(s.category)

      if(self === -1 || other === -1){
        console.log("symptoms in comparison does not have appropriate category");
        return
      }

      // self is greaterThan other:
      // if self is not unknown while other is unknown
      if(self !== 1 && other === 1){
        return true
      }

      // if self is match and other is ancestor
      if(self === 3 && other === 2){
        return true
      }

      // if self is a missmatch and other is an ancestor
      if(self === 0 && other === 1){
        return true
      }

      if((self === 0 && other > 1) || (self > 1 && other === 0)){
        console.log("symptoms in comparison is both a missmatch and ancestor/match");
        console.log("user may have selected a parent symptom as not present and a descendent symptom as present");
        return
      }

      return  false
    } else {
      // two symptoms are equal in their attributes
      return true
    }
  }
})



var Disorder = Class.create(Term, {

  initialize: function($super, key, text, symptom){
    $super(key, text)
    this.symptom = symptom

  },

  getKey: function(){
    var a = this.text.split(/[ ,]+/)
    if(a[0]){
      return a[0]
    }
  },

  getText: function(){
    var a = this.text.split(/[ ,]+/)
    if(a[1]){
      return a.slice(1).join(" ")
    }
    return
  },

  // get text without the key at the front
  getShortText: function(){
    var disText = this.getText()

    var cutoff = 30
    if(disText.length > cutoff){
      disText = disText.slice(0, cutoff) + " ..."
    }
    return disText
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
    // this.popData = this.populateLinkContent(this.procData)
    this.matrix = this.toMatrix(this.procData)
  },

  //utility for sorting symptoms
  setUpOrderingBySelection: function(data, selectionFirst){
    var config = this.config

    data.each(function(d){
      // alphabetical order for the moment
      d.symptom.sort(function(a,b){
        var ap = Symptom.prevalence[a.key]
        var bp = Symptom.prevalence[b.key]

        if (ap > bp){
           return -1;
        } else if (ap < bp){
          return  1;
        } else{
          // prevalence score equal now sort by alphabet
          var aAlpha = a.text.toLowerCase()
          var bAlpha = b.text.toLowerCase()
          if(aAlpha > bAlpha){
            return -1
          } else if (aAlpha < bAlpha){
            return 1
          } else {
            return 0
          }
        }
      })
    })
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

    outputData = []

    // initialize static variable
    Symptom.prevalence = {}

    // logically aggregate symptom
    inputData.each(function(d){
      if(d.symptom.length === 0){return}
      // construct symptom objects
      var original = d.symptom.map(function(s){
        sym = new Symptom(s.key, s.text, s.type, s.category)
        if(clientSelectedSymptom.hasOwnProperty(sym.key)){
          clientSelectedSymptom[s.key].disabled && sym.setDisabled(clientSelectedSymptom[s.key].disabled)
        }

        return sym
      })
      // evaluate symptom category and eliminate redundant ones
      console.log("DISORDER: " + d.key);

      var nonDuplicates = []
      var first = original.pop()
      console.log("PUSHED: " + first.toString());
      nonDuplicates.push(first)

      while(original.length !== 0){
        var next = original.pop()
        var pushAgain = true

        for(i=0; i<nonDuplicates.length; i++){
          within = nonDuplicates[i]
          if(next.key === within.key){
            pushAgain = false
            if(next.greaterThan(within)){
              console.log('REPLACE: ' + within.toString() + " => " + next.toString());
              nonDuplicates[i] = next
              break
            } else {
              console.log('DO NOTHING: ' + within.toString());
            }
          }
        }

        if(pushAgain){
          console.log("PUSHED: " + next.toString());
          nonDuplicates.push(next)
        }
      }
      d.symptom = nonDuplicates
      outputData.push(new Disorder(d.key, d.text, d.symptom))

    })
    console.log(Symptom.prevalence);
    return outputData
  },

  // pre Process data to matrix
  toMatrix: function(data){

    // ordering of raw data
    this.setUpOrderingBySelection(data, true)

    // populate matrix
    var matrix = new Matrix()
    data.each(function(d, i){

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
      d.symptom.each(function(s, j){
        row[j] = {
          x: i,
          y: j,
          z: (s.category !== 'unknown')? true: false
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
