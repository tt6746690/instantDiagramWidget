

TODOs

2. change disorder to onclick and highlight
3. right contianer list all symptom of disorder and show match missmatch
5. add tooltip to disorder names and symptom names


__resources__

[les miserables co-occurence](https://bost.ocks.org/mike/miserables/)  
Phenogrid [demo](https://monarchinitiative.org/page/phenogrid) and [source code](https://github.com/monarch-initiative/phenogrid/blob/master/js/phenogrid.js)
[explanation on selection](https://bost.ocks.org/mike/selection/)
[good explanation on data binding](http://alignedleft.com/tutorials/d3/binding-data/)



__Plannig__


data accepted:

disorder
  + key
    + omim id
  + text
    + disorder description

symptom
  + key
    + hpo id
  + text
    + symptom description
  + symptom or not symptom
    + boolean; whether patient has or not has the symptom


+ OMIM disorders do not include all parent of its associated phenotypes.

1. boqa returns an array of disorders.
2. get all symptoms for each disorder (=S)
3. determine relation of each queried symptom in relation to __user selected ones__ (=U).

```py
for (s in S):
  if(s.id is in U):
    s.type = "exact match"

```



+ only user selected symptoms will be displayed
