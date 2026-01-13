/**
 * @fileoverview ServiceNow-Specific Fixes
 * @description Corrects common typos in ServiceNow API method names and class names,
 * and applies intelligent code transformations for best practices.
 *
 * Two-pass approach:
 * 1. Fast regex-based corrections for known common typos
 * 2. Fuzzy matching (Damerau-Levenshtein) for any remaining typos
 */

import { fuzzyCorrectCode } from './fuzzyMatcher.js';

// ============================================================================
// TYPO CORRECTION PATTERNS
// ============================================================================

// GlideRecord method typos
const GLIDE_RECORD_TYPOS = [
  // addQuery
  [/\.addQeury\(/g, '.addQuery('],
  [/\.addQurey\(/g, '.addQuery('],
  [/\.addQury\(/g, '.addQuery('],
  [/\.addQuer\(/g, '.addQuery('],
  [/\.adQuery\(/g, '.addQuery('],
  // addEncodedQuery
  [/\.addEncodedQeury\(/g, '.addEncodedQuery('],
  [/\.addEncodedQurey\(/g, '.addEncodedQuery('],
  [/\.addEncodedQury\(/g, '.addEncodedQuery('],
  [/\.addEncoddQuery\(/g, '.addEncodedQuery('],
  [/\.addEncodeQuery\(/g, '.addEncodedQuery('],
  // getValue
  [/\.getValeu\(/g, '.getValue('],
  [/\.getVlaue\(/g, '.getValue('],
  [/\.getValu\(/g, '.getValue('],
  [/\.getVale\(/g, '.getValue('],
  [/\.gtValue\(/g, '.getValue('],
  // setValue
  [/\.setValeu\(/g, '.setValue('],
  [/\.setVlaue\(/g, '.setValue('],
  [/\.setValu\(/g, '.setValue('],
  [/\.setVale\(/g, '.setValue('],
  [/\.stValue\(/g, '.setValue('],
  // getDisplayValue
  [/\.getDispalyValue\(/g, '.getDisplayValue('],
  [/\.getDisplayVlaue\(/g, '.getDisplayValue('],
  [/\.getDiplayValue\(/g, '.getDisplayValue('],
  [/\.getDispayValue\(/g, '.getDisplayValue('],
  [/\.getDisplayVale\(/g, '.getDisplayValue('],
  // update
  [/\.udpate\(/g, '.update('],
  [/\.upate\(/g, '.update('],
  [/\.updte\(/g, '.update('],
  [/\.upadte\(/g, '.update('],
  // insert
  [/\.isert\(/g, '.insert('],
  [/\.inser\(/g, '.insert('],
  [/\.insrt\(/g, '.insert('],
  [/\.insertt\(/g, '.insert('],
  // deleteRecord
  [/\.deleteReocrd\(/g, '.deleteRecord('],
  [/\.deletRecord\(/g, '.deleteRecord('],
  [/\.delteRecord\(/g, '.deleteRecord('],
  [/\.deleteRecrod\(/g, '.deleteRecord('],
  // deleteMultiple
  [/\.deleteMultipe\(/g, '.deleteMultiple('],
  [/\.deleteMultple\(/g, '.deleteMultiple('],
  [/\.deleteMutiple\(/g, '.deleteMultiple('],
  [/\.deleteMultipl\(/g, '.deleteMultiple('],
  // getReference
  [/\.getRefrence\(/g, '.getReference('],
  [/\.getReferecne\(/g, '.getReference('],
  [/\.getRefernce\(/g, '.getReference('],
  [/\.getRefreence\(/g, '.getReference('],
  // getReferenceTable
  [/\.getRefrenceTable\(/g, '.getReferenceTable('],
  [/\.getReferecneTable\(/g, '.getReferenceTable('],
  [/\.getRefernceTable\(/g, '.getReferenceTable('],
  [/\.getReferneceTable\(/g, '.getReferenceTable('],
  // canRead
  [/\.canRed\(/g, '.canRead('],
  [/\.canRaed\(/g, '.canRead('],
  [/\.canRaead\(/g, '.canRead('],
  [/\.canReda\(/g, '.canRead('],
  // canWrite
  [/\.canWirte\(/g, '.canWrite('],
  [/\.canWrtie\(/g, '.canWrite('],
  [/\.canWite\(/g, '.canWrite('],
  [/\.canWrit\(/g, '.canWrite('],
  // hasNext
  [/\.hasNex\(/g, '.hasNext('],
  [/\.hasNextt\(/g, '.hasNext('],
  [/\.hasnext\(/g, '.hasNext('],
  [/\.hasNxet\(/g, '.hasNext('],
  // setLimit
  [/\.setLimt\(/g, '.setLimit('],
  [/\.setLiit\(/g, '.setLimit('],
  [/\.setLmit\(/g, '.setLimit('],
  [/\.setLimti\(/g, '.setLimit('],
  // orderBy
  [/\.oderBy\(/g, '.orderBy('],
  [/\.orderBY\(/g, '.orderBy('],
  [/\.ordrBy\(/g, '.orderBy('],
  [/\.orderyB\(/g, '.orderBy('],
  // orderByDesc
  [/\.orderByDes\(/g, '.orderByDesc('],
  [/\.oderByDesc\(/g, '.orderByDesc('],
  [/\.orderByDsc\(/g, '.orderByDesc('],
  [/\.orderByDescend\(/g, '.orderByDesc('],
  [/\.orderByDescending\(/g, '.orderByDesc('],
  // getRowCount
  [/\.getRowCoutn\(/g, '.getRowCount('],
  [/\.getRowCont\(/g, '.getRowCount('],
  [/\.getRowCunt\(/g, '.getRowCount('],
  [/\.getRowCuont\(/g, '.getRowCount('],
  // setWorkflow
  [/\.setWorklfow\(/g, '.setWorkflow('],
  [/\.setWorklflow\(/g, '.setWorkflow('],
  [/\.setWorkfow\(/g, '.setWorkflow('],
  [/\.setworkFlow\(/g, '.setWorkflow('],
  [/\.setworkflow\(/g, '.setWorkflow('],
  [/\.setwrokflow\(/g, '.setWorkflow('],
  // addNullQuery
  [/\.addNulQuery\(/g, '.addNullQuery('],
  [/\.addNullQeury\(/g, '.addNullQuery('],
  [/\.addNullQurey\(/g, '.addNullQuery('],
  [/\.addNulllQuery\(/g, '.addNullQuery('],
  // addNotNullQuery
  [/\.addNotNulQuery\(/g, '.addNotNullQuery('],
  [/\.addNotNullQeury\(/g, '.addNotNullQuery('],
  [/\.addNotNullQurey\(/g, '.addNotNullQuery('],
  [/\.addNotNulllQuery\(/g, '.addNotNullQuery('],
  // getEncodedQuery
  [/\.getEncodedQeury\(/g, '.getEncodedQuery('],
  [/\.getEncodedQurey\(/g, '.getEncodedQuery('],
  [/\.getEncoddQuery\(/g, '.getEncodedQuery('],
  [/\.getEncodeQuery\(/g, '.getEncodedQuery('],
  // setAbortAction
  [/\.setAbtorAction\(/g, '.setAbortAction('],
  [/\.setAbortActoin\(/g, '.setAbortAction('],
  [/\.setAbortAciton\(/g, '.setAbortAction('],
  [/\.setAbortaction\(/g, '.setAbortAction('],
  [/\.setAbourtAction\(/g, '.setAbortAction('],
  [/\.setabortAction\(/g, '.setAbortAction('],
  [/\.setAbortActon\(/g, '.setAbortAction('],
  // getUniqueValue
  [/\.getUniqueVlaue\(/g, '.getUniqueValue('],
  [/\.getUniqeValue\(/g, '.getUniqueValue('],
  [/\.getUniqueValeu\(/g, '.getUniqueValue('],
  [/\.getUniquVlaue\(/g, '.getUniqueValue('],
  // addOrCondition
  [/\.addOrCondtion\(/g, '.addOrCondition('],
  [/\.addOrConditon\(/g, '.addOrCondition('],
  [/\.addOrConditioin\(/g, '.addOrCondition('],
  [/\.addOrCondiiton\(/g, '.addOrCondition('],
  // chooseWindow
  [/\.chooseWinow\(/g, '.chooseWindow('],
  [/\.choseWindow\(/g, '.chooseWindow('],
  [/\.chooseWidnow\(/g, '.chooseWindow('],
  [/\.choosWindow\(/g, '.chooseWindow('],
  // getTableName
  [/\.getTableNmae\(/g, '.getTableName('],
  [/\.getTabelName\(/g, '.getTableName('],
  [/\.getTableNaem\(/g, '.getTableName('],
  [/\.getTabeNlame\(/g, '.getTableName('],
  // getLabel
  [/\.getLable\(/g, '.getLabel('],
  [/\.getLabl\(/g, '.getLabel('],
  [/\.getLaebl\(/g, '.getLabel('],
  [/\.getLabell\(/g, '.getLabel('],
  // getElement
  [/\.getElment\(/g, '.getElement('],
  [/\.getElemnt\(/g, '.getElement('],
  [/\.getEleemnt\(/g, '.getElement('],
  [/\.getElemetn\(/g, '.getElement('],
  // isValidField
  [/\.isValidFeild\(/g, '.isValidField('],
  [/\.isValidFiled\(/g, '.isValidField('],
  [/\.isVaildField\(/g, '.isValidField('],
  [/\.isValidFidel\(/g, '.isValidField('],
  // autoSysFields
  [/\.autoSysFelds\(/g, '.autoSysFields('],
  [/\.autoSysFeilds\(/g, '.autoSysFields('],
  [/\.autoSysFidels\(/g, '.autoSysFields('],
  [/\.atuoSysFields\(/g, '.autoSysFields('],
  // setForceUpdate
  [/\.setForceUpate\(/g, '.setForceUpdate('],
  [/\.setForceUpadte\(/g, '.setForceUpdate('],
  [/\.setForceUdpate\(/g, '.setForceUpdate('],
  [/\.setFroceUpdate\(/g, '.setForceUpdate('],
  // next
  [/\.nexxt\(/g, '.next('],
  [/\.neext\(/g, '.next('],
  [/\.nxet\(/g, '.next('],
  [/\.enxt\(/g, '.next('],
  // query
  [/\.qurey\(/g, '.query('],
  [/\.qeury\(/g, '.query('],
  [/\.queyr\(/g, '.query('],
  [/\.qury\(/g, '.query('],
  // isValid
  [/\.isVlaid\(/g, '.isValid('],
  [/\.isValdi\(/g, '.isValid('],
  [/\.isVaild\(/g, '.isValid('],
  [/\.isValld\(/g, '.isValid('],
  // get
  [/\.gte\(/g, '.get('],
  [/\.geet\(/g, '.get('],
  [/\.gett\(/g, '.get('],
  [/\.egt\(/g, '.get('],
  // addAggregate (GlideAggregate)
  [/\.addAgregate\(/g, '.addAggregate('],
  [/\.addAggergate\(/g, '.addAggregate('],
  [/\.addAggregat\(/g, '.addAggregate('],
  [/\.addAggreagte\(/g, '.addAggregate('],
  // getAggregate (GlideAggregate)
  [/\.getAgregate\(/g, '.getAggregate('],
  [/\.getAggergate\(/g, '.getAggregate('],
  [/\.getAggregat\(/g, '.getAggregate('],
  [/\.getAggreagte\(/g, '.getAggregate('],
  // groupBy (GlideAggregate)
  [/\.gruopBy\(/g, '.groupBy('],
  [/\.groupBY\(/g, '.groupBy('],
  [/\.groupBy\(/g, '.groupBy('],
  [/\.grouBy\(/g, '.groupBy('],
  // getAttachments
  [/\.getAttachmnets\(/g, '.getAttachments('],
  [/\.getAttachemnts\(/g, '.getAttachments('],
  [/\.getAtachments\(/g, '.getAttachments('],
  [/\.getAttachmens\(/g, '.getAttachments('],
  // addActiveQuery
  [/\.addActvieQuery\(/g, '.addActiveQuery('],
  [/\.addAtciveQuery\(/g, '.addActiveQuery('],
  [/\.addActiveQeury\(/g, '.addActiveQuery('],
  [/\.addActiveQurey\(/g, '.addActiveQuery('],
  // addInactiveQuery
  [/\.addInactiveQeury\(/g, '.addInactiveQuery('],
  [/\.addInactiveQurey\(/g, '.addInactiveQuery('],
  [/\.addInactvieQuery\(/g, '.addInactiveQuery('],
  [/\.addInativeQuery\(/g, '.addInactiveQuery('],
  // addJoinQuery
  [/\.addJionQuery\(/g, '.addJoinQuery('],
  [/\.addJoinQeury\(/g, '.addJoinQuery('],
  [/\.addJionQeury\(/g, '.addJoinQuery('],
  [/\.addJoinQurey\(/g, '.addJoinQuery('],
  // addDomainQuery
  [/\.addDomainQeury\(/g, '.addDomainQuery('],
  [/\.addDomianQuery\(/g, '.addDomainQuery('],
  [/\.addDoaminQuery\(/g, '.addDomainQuery('],
  [/\.addDomainQurey\(/g, '.addDomainQuery('],
  // addFunction
  [/\.addFunciton\(/g, '.addFunction('],
  [/\.addFucntion\(/g, '.addFunction('],
  [/\.addFuntion\(/g, '.addFunction('],
  [/\.addFuncion\(/g, '.addFunction('],
  // setCategory
  [/\.setCatagory\(/g, '.setCategory('],
  [/\.setCategroy\(/g, '.setCategory('],
  [/\.setCatgeory\(/g, '.setCategory('],
  [/\.setCategorry\(/g, '.setCategory('],
  // setEncodedQuery
  [/\.setEncodedQeury\(/g, '.setEncodedQuery('],
  [/\.setEncodedQurey\(/g, '.setEncodedQuery('],
  [/\.setEncoddQuery\(/g, '.setEncodedQuery('],
  [/\.setEncodeQuery\(/g, '.setEncodedQuery('],
  // setQueryReferences
  [/\.setQueryRefernces\(/g, '.setQueryReferences('],
  [/\.setQueryReferecnes\(/g, '.setQueryReferences('],
  [/\.setQueryRefrences\(/g, '.setQueryReferences('],
  [/\.setQueryRefrenecs\(/g, '.setQueryReferences('],
  // setDisplayValue
  [/\.setDisplayVlaue\(/g, '.setDisplayValue('],
  [/\.setDisplayValeu\(/g, '.setDisplayValue('],
  [/\.setDislplayValue\(/g, '.setDisplayValue('],
  [/\.setDispalyValue\(/g, '.setDisplayValue('],
  // getED
  [/\.getEd\(/g, '.getED('],
  [/\.getDE\(/g, '.getED('],
  [/\.gtED\(/g, '.getED('],
  [/\.geted\(/g, '.getED('],
  // getAttribute
  [/\.getAttriubte\(/g, '.getAttribute('],
  [/\.getAtributte\(/g, '.getAttribute('],
  [/\.getAttrbiute\(/g, '.getAttribute('],
  [/\.getAttributte\(/g, '.getAttribute('],
  // isValidRecord
  [/\.isValidReocrd\(/g, '.isValidRecord('],
  [/\.isValidRecrod\(/g, '.isValidRecord('],
  [/\.isVlaidRecord\(/g, '.isValidRecord('],
  [/\.isValidReocdr\(/g, '.isValidRecord('],
  // isNewRecord
  [/\.isNewReocrd\(/g, '.isNewRecord('],
  [/\.isNewRecrod\(/g, '.isNewRecord('],
  [/\.isNweRecord\(/g, '.isNewRecord('],
  [/\.isNewReocdr\(/g, '.isNewRecord('],
  // nil
  [/\.nill\(/g, '.nil('],
  [/\.nli\(/g, '.nil('],
  [/\.nnill\(/g, '.nil('],
  [/\.niil\(/g, '.nil('],
  // getFields
  [/\.getFidels\(/g, '.getFields('],
  [/\.getFelds\(/g, '.getFields('],
  [/\.getFieldss\(/g, '.getFields('],
  [/\.getFileds\(/g, '.getFields('],
  // getElements
  [/\.getElments\(/g, '.getElements('],
  [/\.getElemnts\(/g, '.getElements('],
  [/\.getElementss\(/g, '.getElements('],
  [/\.getElemtns\(/g, '.getElements('],
  // applyTemplate
  [/\.applyTemplete\(/g, '.applyTemplate('],
  [/\.applyTemplat\(/g, '.applyTemplate('],
  [/\.apllyTemplate\(/g, '.applyTemplate('],
  [/\.applyTempalte\(/g, '.applyTemplate('],
  // newRecord
  [/\.newRecrod\(/g, '.newRecord('],
  [/\.newReocrd\(/g, '.newRecord('],
  [/\.newRecodr\(/g, '.newRecord('],
  [/\.nweRecord\(/g, '.newRecord('],
  // initialize
  [/\.intialize\(/g, '.initialize('],
  [/\.intiialize\(/g, '.initialize('],
  [/\.initalize\(/g, '.initialize('],
  [/\.initailize\(/g, '.initialize('],
  // isActionAborted
  [/\.isActionAbortd\(/g, '.isActionAborted('],
  [/\.isActoinAborted\(/g, '.isActionAborted('],
  [/\.isActionAboretd\(/g, '.isActionAborted('],
  [/\.isActionAbortedd\(/g, '.isActionAborted('],
  // setNewGuidValue
  [/\.setNewGuidVlaue\(/g, '.setNewGuidValue('],
  [/\.setNewGuidValeu\(/g, '.setNewGuidValue('],
  [/\.setNewGuidVaule\(/g, '.setNewGuidValue('],
  [/\.setNewGudiValue\(/g, '.setNewGuidValue('],
  // operation
  [/\.operaiton\(/g, '.operation('],
  [/\.operatoin\(/g, '.operation('],
  [/\.opertaion\(/g, '.operation('],
  [/\.opertion\(/g, '.operation('],
  // setLocation
  [/\.setLocaiton\(/g, '.setLocation('],
  [/\.setLocatoin\(/g, '.setLocation('],
  [/\.setLoaction\(/g, '.setLocation('],
  [/\.setLoacation\(/g, '.setLocation('],
  // canCreate
  [/\.canCraete\(/g, '.canCreate('],
  [/\.canCreaet\(/g, '.canCreate('],
  [/\.canCreat\(/g, '.canCreate('],
  [/\.canCretae\(/g, '.canCreate('],
  // canDelete
  [/\.canDelte\(/g, '.canDelete('],
  [/\.canDeleet\(/g, '.canDelete('],
  [/\.canDleete\(/g, '.canDelete('],
  [/\.canDelet\(/g, '.canDelete('],
  // getClassDisplayValue
  [/\.getClassDisplayVlaue\(/g, '.getClassDisplayValue('],
  [/\.getClassDisplayValeu\(/g, '.getClassDisplayValue('],
  [/\.getClassDiplayValue\(/g, '.getClassDisplayValue('],
  [/\.getClassDispalyValue\(/g, '.getClassDisplayValue('],
  // getRecordClassName
  [/\.getRecordClassNmae\(/g, '.getRecordClassName('],
  [/\.getRecordClassNaem\(/g, '.getRecordClassName('],
  [/\.getRecrodClassName\(/g, '.getRecordClassName('],
  [/\.getReocrdClassName\(/g, '.getRecordClassName('],
  // updateMultiple
  [/\.updateMutliple\(/g, '.updateMultiple('],
  [/\.udpateMultiple\(/g, '.updateMultiple('],
  [/\.updateMultipe\(/g, '.updateMultiple('],
  [/\.updateMultipl\(/g, '.updateMultiple('],
  // getLink
  [/\.getLnik\(/g, '.getLink('],
  [/\.getLik\(/g, '.getLink('],
  [/\.getLikn\(/g, '.getLink('],
  [/\.getLnk\(/g, '.getLink('],
  // getBooleanValue
  [/\.getBooleanVlaue\(/g, '.getBooleanValue('],
  [/\.getBooleanValeu\(/g, '.getBooleanValue('],
  [/\.getBooelanValue\(/g, '.getBooleanValue('],
  [/\.getBoolenaValue\(/g, '.getBooleanValue('],
];

// GlideElement method typos
const GLIDE_ELEMENT_TYPOS = [
  // getED
  [/\.getEd\(/g, '.getED('],
  [/\.getDE\(/g, '.getED('],
  [/\.geted\(/g, '.getED('],
  [/\.gtED\(/g, '.getED('],
  // getReferenceTable
  [/\.getReferecneTable\(/g, '.getReferenceTable('],
  [/\.getRefernceTable\(/g, '.getReferenceTable('],
  [/\.getRefrenceTable\(/g, '.getReferenceTable('],
  [/\.getReferneceTable\(/g, '.getReferenceTable('],
  // getRefRecord
  [/\.getRefRecrod\(/g, '.getRefRecord('],
  [/\.getRefReocrd\(/g, '.getRefRecord('],
  [/\.getRefRecodr\(/g, '.getRefRecord('],
  [/\.getRefRecrd\(/g, '.getRefRecord('],
  // getJournalEntry
  [/\.getJournlaEntry\(/g, '.getJournalEntry('],
  [/\.getJournalEnrty\(/g, '.getJournalEntry('],
  [/\.getJounralEntry\(/g, '.getJournalEntry('],
  [/\.getJournalEntrry\(/g, '.getJournalEntry('],
  // changes
  [/\.chnages\(/g, '.changes('],
  [/\.chagnes\(/g, '.changes('],
  [/\.changs\(/g, '.changes('],
  [/\.chanegs\(/g, '.changes('],
  // changesFrom
  [/\.chnagesFrom\(/g, '.changesFrom('],
  [/\.changesFromm\(/g, '.changesFrom('],
  [/\.changesFomr\(/g, '.changesFrom('],
  [/\.changesFrom\(/g, '.changesFrom('],
  // changesTo
  [/\.chnagesTo\(/g, '.changesTo('],
  [/\.changesToo\(/g, '.changesTo('],
  [/\.changesToo\(/g, '.changesTo('],
  [/\.changestTo\(/g, '.changesTo('],
  // nil
  [/\.nill\(/g, '.nil('],
  [/\.nli\(/g, '.nil('],
  [/\.nnill\(/g, '.nil('],
  [/\.niil\(/g, '.nil('],
  // toString
  [/\.toStirng\(/g, '.toString('],
  [/\.toStrng\(/g, '.toString('],
  [/\.toStrign\(/g, '.toString('],
  [/\.toStrnig\(/g, '.toString('],
  // dateNumericValue
  [/\.dateNumericVlaue\(/g, '.dateNumericValue('],
  [/\.dateNumericValeu\(/g, '.dateNumericValue('],
  [/\.dateNumeircValue\(/g, '.dateNumericValue('],
  [/\.dateNuemricValue\(/g, '.dateNumericValue('],
  // setDateNumericValue
  [/\.setDateNumericVlaue\(/g, '.setDateNumericValue('],
  [/\.setDateNumericValeu\(/g, '.setDateNumericValue('],
  [/\.setDateNumeircValue\(/g, '.setDateNumericValue('],
  [/\.setDateNuemricValue\(/g, '.setDateNumericValue('],
  // getChoices
  [/\.getChocies\(/g, '.getChoices('],
  [/\.getChioces\(/g, '.getChoices('],
  [/\.getChoicse\(/g, '.getChoices('],
  [/\.getChioces\(/g, '.getChoices('],
  // getAttribute
  [/\.getAttriubte\(/g, '.getAttribute('],
  [/\.getAtributte\(/g, '.getAttribute('],
  [/\.getAttrbiute\(/g, '.getAttribute('],
  [/\.getAttributte\(/g, '.getAttribute('],
  // getBooleanAttribute
  [/\.getBooleanAttriubte\(/g, '.getBooleanAttribute('],
  [/\.getBooleanAtributte\(/g, '.getBooleanAttribute('],
  [/\.getBooleanAttrbiute\(/g, '.getBooleanAttribute('],
  [/\.getBooelanAttribute\(/g, '.getBooleanAttribute('],
  // getHTMLValue
  [/\.getHTMLVlaue\(/g, '.getHTMLValue('],
  [/\.getHTMlValue\(/g, '.getHTMLValue('],
  [/\.getHtmlVlaue\(/g, '.getHTMLValue('],
  [/\.getHTMLValeu\(/g, '.getHTMLValue('],
  // getGlideObject
  [/\.getGlideObeject\(/g, '.getGlideObject('],
  [/\.getGlideObjcet\(/g, '.getGlideObject('],
  [/\.getGlideObejct\(/g, '.getGlideObject('],
  [/\.getGldieoObject\(/g, '.getGlideObject('],
  // setInitialValue
  [/\.setInitailValue\(/g, '.setInitialValue('],
  [/\.setInitialVlaue\(/g, '.setInitialValue('],
  [/\.setInitialValeu\(/g, '.setInitialValue('],
  [/\.setInitalValue\(/g, '.setInitialValue('],
  // getLabel
  [/\.getLable\(/g, '.getLabel('],
  [/\.getLabl\(/g, '.getLabel('],
  [/\.getLaebl\(/g, '.getLabel('],
  [/\.getLabell\(/g, '.getLabel('],
  // getTableName
  [/\.getTableNmae\(/g, '.getTableName('],
  [/\.getTabelName\(/g, '.getTableName('],
  [/\.getTableNaem\(/g, '.getTableName('],
  [/\.getTabeNlame\(/g, '.getTableName('],
  // getName
  [/\.getNmae\(/g, '.getName('],
  [/\.getNaem\(/g, '.getName('],
  [/\.getNam\(/g, '.getName('],
  [/\.getNamee\(/g, '.getName('],
  // getTextContent
  [/\.getTextContnet\(/g, '.getTextContent('],
  [/\.getTextContetn\(/g, '.getTextContent('],
  [/\.getTextCotent\(/g, '.getTextContent('],
  [/\.getTxtContent\(/g, '.getTextContent('],
  // canRead
  [/\.canRed\(/g, '.canRead('],
  [/\.canRaed\(/g, '.canRead('],
  [/\.canRaead\(/g, '.canRead('],
  [/\.canReda\(/g, '.canRead('],
  // canWrite
  [/\.canWirte\(/g, '.canWrite('],
  [/\.canWrtie\(/g, '.canWrite('],
  [/\.canWite\(/g, '.canWrite('],
  [/\.canWrit\(/g, '.canWrite('],
  // hasRightsTo
  [/\.hasRigthsTo\(/g, '.hasRightsTo('],
  [/\.hasRighsTo\(/g, '.hasRightsTo('],
  [/\.hasRightsToo\(/g, '.hasRightsTo('],
  [/\.hasRigtsTo\(/g, '.hasRightsTo('],
  // setError
  [/\.setErorr\(/g, '.setError('],
  [/\.setErro\(/g, '.setError('],
  [/\.setErrorr\(/g, '.setError('],
  [/\.setErrro\(/g, '.setError('],
  // setPhoneNumber
  [/\.setPhoneNumebr\(/g, '.setPhoneNumber('],
  [/\.setPhoneNumbr\(/g, '.setPhoneNumber('],
  [/\.setPhoenNumber\(/g, '.setPhoneNumber('],
  [/\.setPhoneNubmer\(/g, '.setPhoneNumber('],
];

// ServiceNow class name typos
const CLASS_NAME_TYPOS = [
  // GlideRecord
  [/GlideReocrd/g, 'GlideRecord'],
  [/GlideRecrod/g, 'GlideRecord'],
  [/GlidRecord/g, 'GlideRecord'],
  [/GlideReord/g, 'GlideRecord'],
  [/GldieRecord/g, 'GlideRecord'],
  // GlideRecordSecure
  [/GlideRecordSecrue/g, 'GlideRecordSecure'],
  [/GlideReocrdSecure/g, 'GlideRecordSecure'],
  [/GlideRecrodSecure/g, 'GlideRecordSecure'],
  [/GlideRecordSecur/g, 'GlideRecordSecure'],
  // GlideAggregate
  [/GlideAggreaget/g, 'GlideAggregate'],
  [/GlideAggreagte/g, 'GlideAggregate'],
  [/GlideAggreaet/g, 'GlideAggregate'],
  [/GlideAgregate/g, 'GlideAggregate'],
  // GlideElement
  [/GlideElment/g, 'GlideElement'],
  [/GlideElemnt/g, 'GlideElement'],
  [/GldieElement/g, 'GlideElement'],
  [/GlideEleemnt/g, 'GlideElement'],
  // GlideQueryCondition
  [/GlideQueryCondtion/g, 'GlideQueryCondition'],
  [/GlideQueryConditon/g, 'GlideQueryCondition'],
  [/GlidQueryCondition/g, 'GlideQueryCondition'],
  [/GlideQeruryCondition/g, 'GlideQueryCondition'],
  // GlideElementDescriptor
  [/GlideElementDecriptor/g, 'GlideElementDescriptor'],
  [/GlideElmentDescriptor/g, 'GlideElementDescriptor'],
  [/GlideElementDescrpitor/g, 'GlideElementDescriptor'],
  [/GlideElementDescirptor/g, 'GlideElementDescriptor'],
  // GlideDateTime
  [/GlideDateTiem/g, 'GlideDateTime'],
  [/GlideDatetime/g, 'GlideDateTime'],
  [/GlideDateTme/g, 'GlideDateTime'],
  [/GldieDatetime/g, 'GlideDateTime'],
  // GlideDate
  [/GlideDat\b/g, 'GlideDate'],
  [/GldieDate/g, 'GlideDate'],
  [/GlideDaet/g, 'GlideDate'],
  [/GlideDatee/g, 'GlideDate'],
  // GlideTime
  [/GlideTiem/g, 'GlideTime'],
  [/GldieTime/g, 'GlideTime'],
  [/GlidTiem/g, 'GlideTime'],
  [/GlideTimee/g, 'GlideTime'],
  // GlideDuration
  [/GlideDuraiton/g, 'GlideDuration'],
  [/GldieDuration/g, 'GlideDuration'],
  [/GlideDuraton/g, 'GlideDuration'],
  [/GlideDuratioin/g, 'GlideDuration'],
  // GlideSchedule
  [/GlideScheulde/g, 'GlideSchedule'],
  [/GlidSchedule/g, 'GlideSchedule'],
  [/GlideSchdule/g, 'GlideSchedule'],
  [/GlideScehdule/g, 'GlideSchedule'],
  // GlideCalendarDateTime
  [/GlideCalendarDateTiem/g, 'GlideCalendarDateTime'],
  [/GlideCalendarDatetime/g, 'GlideCalendarDateTime'],
  [/GlideCaledndarDateTime/g, 'GlideCalendarDateTime'],
  [/GlideCalendarDateTimee/g, 'GlideCalendarDateTime'],
  // GlideUser
  [/GlideUsr/g, 'GlideUser'],
  [/GldieUser/g, 'GlideUser'],
  [/GlideUserr/g, 'GlideUser'],
  [/GliedUser/g, 'GlideUser'],
  // GlideSession
  [/GlideSesssion/g, 'GlideSession'],
  [/GlideSesson/g, 'GlideSession'],
  [/GlideSesion/g, 'GlideSession'],
  [/GlideSessionn/g, 'GlideSession'],
  // GlideAjax
  [/GlideAjxa/g, 'GlideAjax'],
  [/GlidAjax/g, 'GlideAjax'],
  [/GlideAjx/g, 'GlideAjax'],
  [/GlideAjaxx/g, 'GlideAjax'],
  // GlideHTTPRequest
  [/GlideHTTPReqeust/g, 'GlideHTTPRequest'],
  [/GlideHTTPRequset/g, 'GlideHTTPRequest'],
  [/GlideHttpRequest/g, 'GlideHTTPRequest'],
  [/GlideHTTPReqest/g, 'GlideHTTPRequest'],
  // RESTMessageV2
  [/RESTMessagV2/g, 'RESTMessageV2'],
  [/RESTMessagev2/g, 'RESTMessageV2'],
  [/RESTMessaeV2/g, 'RESTMessageV2'],
  [/RESMessageV2/g, 'RESTMessageV2'],
  // RESTResponseV2
  [/RESTResponeV2/g, 'RESTResponseV2'],
  [/RESTResponsev2/g, 'RESTResponseV2'],
  [/RESTRespnoseV2/g, 'RESTResponseV2'],
  [/RESResponseV2/g, 'RESTResponseV2'],
  // SOAPMessageV2
  [/SOAPMessagV2/g, 'SOAPMessageV2'],
  [/SOAPMessagev2/g, 'SOAPMessageV2'],
  [/SOAPMessaeV2/g, 'SOAPMessageV2'],
  [/SOPAMessageV2/g, 'SOAPMessageV2'],
  // SOAPResponseV2
  [/SOAPResponeV2/g, 'SOAPResponseV2'],
  [/SOAPResponsev2/g, 'SOAPResponseV2'],
  [/SOAPRespnoseV2/g, 'SOAPResponseV2'],
  [/SOPAResponseV2/g, 'SOAPResponseV2'],
  // GlideSysAttachment
  [/GlideSysAttachement/g, 'GlideSysAttachment'],
  [/GlideSysAttahcment/g, 'GlideSysAttachment'],
  [/GlideSysAtachment/g, 'GlideSysAttachment'],
  [/GlideSysAtachement/g, 'GlideSysAttachment'],
  // XMLDocument2
  [/XMLDocuemnt2/g, 'XMLDocument2'],
  [/XMLDocumnet2/g, 'XMLDocument2'],
  [/XMlDocument2/g, 'XMLDocument2'],
  [/XMLDocumetn2/g, 'XMLDocument2'],
  // XMLDocument
  [/XMLDocuemnt\b/g, 'XMLDocument'],
  [/XMLDocumnet\b/g, 'XMLDocument'],
  [/XMlDocument\b/g, 'XMLDocument'],
  [/XMLDocumetn\b/g, 'XMLDocument'],
  // XMLNode
  [/XMLNdoe/g, 'XMLNode'],
  [/XMLNoed/g, 'XMLNode'],
  [/XMlNode/g, 'XMLNode'],
  [/XMLNodee/g, 'XMLNode'],
  // XMLNodeIterator
  [/XMLNodeIteraotr/g, 'XMLNodeIterator'],
  [/XMLNodeItertor/g, 'XMLNodeIterator'],
  [/XMLNdoeIterator/g, 'XMLNodeIterator'],
  [/XMLNodeIteratror/g, 'XMLNodeIterator'],
  // GlideEmailOutbound
  [/GlideEmailOutbond/g, 'GlideEmailOutbound'],
  [/GlideEmailOutboud/g, 'GlideEmailOutbound'],
  [/GlidEmailOutbound/g, 'GlideEmailOutbound'],
  [/GlideEmailOutboundd/g, 'GlideEmailOutbound'],
  // ArrayUtil
  [/ArrayUitl/g, 'ArrayUtil'],
  [/ArrrayUtil/g, 'ArrayUtil'],
  [/ArrayUtl/g, 'ArrayUtil'],
  [/AraryUtil/g, 'ArrayUtil'],
  // GlideStringUtil
  [/GlideStringUtl/g, 'GlideStringUtil'],
  [/GldieStringUtil/g, 'GlideStringUtil'],
  [/GlideStirngUtil/g, 'GlideStringUtil'],
  [/GlideStringUtill/g, 'GlideStringUtil'],
  // GlideXMLUtil
  [/GlideXMlUtil/g, 'GlideXMLUtil'],
  [/GlideXMLUtl/g, 'GlideXMLUtil'],
  [/GldieXMLUtil/g, 'GlideXMLUtil'],
  [/GlideXMLUtill/g, 'GlideXMLUtil'],
  // GlideFilter
  [/GlideFiltr/g, 'GlideFilter'],
  [/GlideFitler/g, 'GlideFilter'],
  [/GlidFilter/g, 'GlideFilter'],
  [/GlideFilterr/g, 'GlideFilter'],
  // GlideTableHierarchy
  [/GlideTableHiearchy/g, 'GlideTableHierarchy'],
  [/GlideTableHeirarchy/g, 'GlideTableHierarchy'],
  [/GlideTabelHierarchy/g, 'GlideTableHierarchy'],
  [/GlideTableHierarhcy/g, 'GlideTableHierarchy'],
  // GlideScopedEvaluator
  [/GlideScopedEvalutor/g, 'GlideScopedEvaluator'],
  [/GlideScopedEvaultor/g, 'GlideScopedEvaluator'],
  [/GlideScopedEvaluater/g, 'GlideScopedEvaluator'],
  [/GlidScopedEvaluator/g, 'GlideScopedEvaluator'],
  // JSUtil
  [/JSUitl/g, 'JSUtil'],
  [/JsUtil/g, 'JSUtil'],
  [/JUStil/g, 'JSUtil'],
  [/JSUtill/g, 'JSUtil'],
  // TableUtils
  [/TableUitls/g, 'TableUtils'],
  [/TabelUtils/g, 'TableUtils'],
  [/TableUtlis/g, 'TableUtils'],
  [/TableUtilss/g, 'TableUtils'],
  // J2js
  [/J2Js/g, 'J2js'],
  [/j2Js/g, 'J2js'],
  [/J2JS/g, 'J2js'],
  [/j2JS/g, 'J2js'],
  // GlideSecureRandom
  [/GlideSecureRnadom/g, 'GlideSecureRandom'],
  [/GlideSecurRandom/g, 'GlideSecureRandom'],
  [/GlidSecureRandom/g, 'GlideSecureRandom'],
  [/GlideSecureRnaodm/g, 'GlideSecureRandom'],
  // GlideDigest
  [/GlideDigset/g, 'GlideDigest'],
  [/GldieDgest/g, 'GlideDigest'],
  [/GlideDigst/g, 'GlideDigest'],
  [/GlideDiegest/g, 'GlideDigest'],
  // GlideEncrypter
  [/GlideEncryptor/g, 'GlideEncrypter'],
  [/GlideEncryptre/g, 'GlideEncrypter'],
  [/GlidEncrypter/g, 'GlideEncrypter'],
  [/GlideEncrytper/g, 'GlideEncrypter'],
  // GlideCertificateEncryption
  [/GlideCertificateEncrytion/g, 'GlideCertificateEncryption'],
  [/GlideCertificateEncyrption/g, 'GlideCertificateEncryption'],
  [/GlideCertifiacteEncryption/g, 'GlideCertificateEncryption'],
  [/GlideCertificateEncrption/g, 'GlideCertificateEncryption'],
  // GlidePluginManager
  [/GlidePluginManger/g, 'GlidePluginManager'],
  [/GlidePluginMangaer/g, 'GlidePluginManager'],
  [/GlidPluginManager/g, 'GlidePluginManager'],
  [/GlidePlugnManager/g, 'GlidePluginManager'],
  // GlideDBFunctionBuilder
  [/GlideDBFuncitonBuilder/g, 'GlideDBFunctionBuilder'],
  [/GlideDBFunctionBulder/g, 'GlideDBFunctionBuilder'],
  [/GlideDBFuntionBuilder/g, 'GlideDBFunctionBuilder'],
  [/GlideDBFunctonBuilder/g, 'GlideDBFunctionBuilder'],
  // Workflow
  [/Worklfow/g, 'Workflow'],
  [/Worklflow/g, 'Workflow'],
  [/Worfklow/g, 'Workflow'],
  [/Workfow/g, 'Workflow'],
  // FlowAPI
  [/FlowApi/g, 'FlowAPI'],
  [/FlowAPi/g, 'FlowAPI'],
  [/flowAPI/g, 'FlowAPI'],
  [/FlowAIP/g, 'FlowAPI'],
  // TemplatePrinter
  [/TemplatePritner/g, 'TemplatePrinter'],
  [/TemplateePrinter/g, 'TemplatePrinter'],
  [/TemplatePriner/g, 'TemplatePrinter'],
  [/TempalePrinter/g, 'TemplatePrinter'],
  // GlideLocale
  [/GlideLoacle/g, 'GlideLocale'],
  [/GlidLocale/g, 'GlideLocale'],
  [/GlideLoacale/g, 'GlideLocale'],
  [/GlideLocalee/g, 'GlideLocale'],
  // JSON
  [/\bJOSN\b/g, 'JSON'],
  [/\bJSOn\b/g, 'JSON'],
  [/\bjson\b/g, 'JSON'],
  [/\bJSoN\b/g, 'JSON'],
  // AbstractAjaxProcessor
  [/AbstractAjaxProcessro/g, 'AbstractAjaxProcessor'],
  [/AbstracAjaxProcessor/g, 'AbstractAjaxProcessor'],
  [/AbstractAjxProcessor/g, 'AbstractAjaxProcessor'],
  [/AbstractAjaxPrcoessor/g, 'AbstractAjaxProcessor'],
  // GlideEvaluator
  [/GlideEvalutor/g, 'GlideEvaluator'],
  [/GlideEvaultor/g, 'GlideEvaluator'],
  [/GlidEvaluator/g, 'GlideEvaluator'],
  [/GlideEvaluater/g, 'GlideEvaluator'],
  // GlideUpdateManager
  [/GlideUpdateManger/g, 'GlideUpdateManager'],
  [/GlideUpdateMangaer/g, 'GlideUpdateManager'],
  [/GlidUpdateManager/g, 'GlideUpdateManager'],
  [/GlideUpdateManagr/g, 'GlideUpdateManager'],
  // GlideUpdateSet
  [/GlideUpdateSte/g, 'GlideUpdateSet'],
  [/GlideUdpateSet/g, 'GlideUpdateSet'],
  [/GlidUpdateSet/g, 'GlideUpdateSet'],
  [/GlideUpdatSet/g, 'GlideUpdateSet'],
  // GlideImpersonate
  [/GlideImpersonat/g, 'GlideImpersonate'],
  [/GlideImpersonae/g, 'GlideImpersonate'],
  [/GlidImpersonate/g, 'GlideImpersonate'],
  [/GlideImeprsonate/g, 'GlideImpersonate'],
  // GlideAppLoader
  [/GlideAppLoadr/g, 'GlideAppLoader'],
  [/GlideApploader/g, 'GlideAppLoader'],
  [/GlidAppLoader/g, 'GlideAppLoader'],
  [/GlideAppLoaer/g, 'GlideAppLoader'],
  // GlideChoice
  [/GlideChocie/g, 'GlideChoice'],
  [/GlideChioce/g, 'GlideChoice'],
  [/GlidChoice/g, 'GlideChoice'],
  [/GlideChice/g, 'GlideChoice'],
  // GlideOAuthClient
  [/GlideOAuthClinet/g, 'GlideOAuthClient'],
  [/GlideOAuthCleint/g, 'GlideOAuthClient'],
  [/GlidOAuthClient/g, 'GlideOAuthClient'],
  [/GlideOAthClient/g, 'GlideOAuthClient'],
  // GlideOAuthClientRequest
  [/GlideOAuthClientReqeust/g, 'GlideOAuthClientRequest'],
  [/GlideOAuthClientRequset/g, 'GlideOAuthClientRequest'],
  [/GlidOAuthClientRequest/g, 'GlideOAuthClientRequest'],
  [/GlideOAuthCleintRequest/g, 'GlideOAuthClientRequest'],
  // GlideOAuthClientResponse
  [/GlideOAuthClientRespone/g, 'GlideOAuthClientResponse'],
  [/GlideOAuthClientRespnose/g, 'GlideOAuthClientResponse'],
  [/GlidOAuthClientResponse/g, 'GlideOAuthClientResponse'],
  [/GlideOAuthCleintResponse/g, 'GlideOAuthClientResponse'],
  // GlideScriptedProcessor
  [/GlideScriptedProcesoor/g, 'GlideScriptedProcessor'],
  [/GlideScriptedProcessro/g, 'GlideScriptedProcessor'],
  [/GlidScriptedProcessor/g, 'GlideScriptedProcessor'],
  [/GlideScritpedProcessor/g, 'GlideScriptedProcessor'],
  // GlideServletRequest
  [/GlideServletReqeust/g, 'GlideServletRequest'],
  [/GlideServletRequset/g, 'GlideServletRequest'],
  [/GlidServletRequest/g, 'GlideServletRequest'],
  [/GlideServeltRequest/g, 'GlideServletRequest'],
  // GlideServletResponse
  [/GlideServletRespone/g, 'GlideServletResponse'],
  [/GlideServletRespnose/g, 'GlideServletResponse'],
  [/GlidServletResponse/g, 'GlideServletResponse'],
  [/GlideServeltResponse/g, 'GlideServletResponse'],
  // GlideSPScriptable
  [/GlideSPScirptable/g, 'GlideSPScriptable'],
  [/GlideSPScriptabel/g, 'GlideSPScriptable'],
  [/GlidSPScriptable/g, 'GlideSPScriptable'],
  [/GlideSPScritpable/g, 'GlideSPScriptable'],
  // SNC
  [/Snc/g, 'SNC'],
  [/snC/g, 'SNC'],
  [/sNC/g, 'SNC'],
  [/SnC/g, 'SNC'],
];

// GlideDateTime method typos
const GLIDE_DATETIME_TYPOS = [
  [/\.addSecnods\(/g, '.addSeconds('],
  [/\.addSecods\(/g, '.addSeconds('],
  [/\.addSeoncds\(/g, '.addSeconds('],
  [/\.addDyas\(/g, '.addDays('],
  [/\.addDasy\(/g, '.addDays('],
  [/\.addDaysLocalTiem\(/g, '.addDaysLocalTime('],
  [/\.addDaysLocaTime\(/g, '.addDaysLocalTime('],
  [/\.addMonhts\(/g, '.addMonths('],
  [/\.addMontsh\(/g, '.addMonths('],
  [/\.addMonthsLocalTiem\(/g, '.addMonthsLocalTime('],
  [/\.addYaers\(/g, '.addYears('],
  [/\.addYeasr\(/g, '.addYears('],
  [/\.addWekks\(/g, '.addWeeks('],
  [/\.addWekes\(/g, '.addWeeks('],
  [/\.getDayOfWek\(/g, '.getDayOfWeek('],
  [/\.getDayOfWekk\(/g, '.getDayOfWeek('],
  [/\.getDayOfWeekLocalTiem\(/g, '.getDayOfWeekLocalTime('],
  [/\.getNumericVlaue\(/g, '.getNumericValue('],
  [/\.getNumericValeu\(/g, '.getNumericValue('],
  [/\.getNumeircValue\(/g, '.getNumericValue('],
  [/\.getMonthLocalTiem\(/g, '.getMonthLocalTime('],
  [/\.getMontLocalTime\(/g, '.getMonthLocalTime('],
  [/\.comparTo\(/g, '.compareTo('],
  [/\.comapreTo\(/g, '.compareTo('],
  [/\.compaerTo\(/g, '.compareTo('],
  [/\.getDat\(/g, '.getDate('],
  [/\.getDaet\(/g, '.getDate('],
  [/\.getTiem\(/g, '.getTime('],
  [/\.getTim\(/g, '.getTime('],
  [/\.getLocalDat\(/g, '.getLocalDate('],
  [/\.getLocalDaet\(/g, '.getLocalDate('],
  [/\.getLocalTiem\(/g, '.getLocalTime('],
  [/\.getLocalTim\(/g, '.getLocalTime('],
  [/\.setDisplayVlaue\(/g, '.setDisplayValue('],
  [/\.setDisplayValeu\(/g, '.setDisplayValue('],
  [/\.setDisplayValueIntenral\(/g, '.setDisplayValueInternal('],
  [/\.setDisplayVlaueInternal\(/g, '.setDisplayValueInternal('],
  [/\.substract\(/g, '.subtract('],
  [/\.subtarct\(/g, '.subtract('],
  [/\.beofre\(/g, '.before('],
  [/\.aftre\(/g, '.after('],
  [/\.onOrBeofre\(/g, '.onOrBefore('],
  [/\.onOrAftre\(/g, '.onOrAfter('],
  // hasDate
  [/\.hasDat\(/g, '.hasDate('],
  [/\.hasDaet\(/g, '.hasDate('],
  // equals
  [/\.equlas\(/g, '.equals('],
  [/\.eqauls\(/g, '.equals('],
  // getYearLocalTime
  [/\.getYearLocalTiem\(/g, '.getYearLocalTime('],
  [/\.getYaerLocalTime\(/g, '.getYearLocalTime('],
  // getYearUTC
  [/\.getYearUTc\(/g, '.getYearUTC('],
  [/\.getYaerUTC\(/g, '.getYearUTC('],
  // getMonthUTC
  [/\.getMontUTC\(/g, '.getMonthUTC('],
  [/\.getMonhtUTC\(/g, '.getMonthUTC('],
  // getDayOfMonthLocalTime
  [/\.getDayOfMonthLocalTiem\(/g, '.getDayOfMonthLocalTime('],
  [/\.getDayOfMonhtLocalTime\(/g, '.getDayOfMonthLocalTime('],
  // getDayOfMonthUTC
  [/\.getDayOfMonthUTc\(/g, '.getDayOfMonthUTC('],
  [/\.getDayOfMonhtUTC\(/g, '.getDayOfMonthUTC('],
  // getWeekOfYearLocalTime
  [/\.getWeekOfYearLocalTiem\(/g, '.getWeekOfYearLocalTime('],
  [/\.getWeekOfYaerLocalTime\(/g, '.getWeekOfYearLocalTime('],
  // getWeekOfYearUTC
  [/\.getWeekOfYearUTc\(/g, '.getWeekOfYearUTC('],
  [/\.getWeekOfYaerUTC\(/g, '.getWeekOfYearUTC('],
  // getInternalFormattedLocalTime
  [/\.getInternalFormattedLocalTiem\(/g, '.getInternalFormattedLocalTime('],
  [/\.getInternalFormatedLocalTime\(/g, '.getInternalFormattedLocalTime('],
  // setGlideDateTime
  [/\.setGlideDateTiem\(/g, '.setGlideDateTime('],
  [/\.setGldieDateTIme\(/g, '.setGlideDateTime('],
  // setValueUTC
  [/\.setValueUTc\(/g, '.setValueUTC('],
  [/\.setVlaueUTC\(/g, '.setValueUTC('],
  // getErrorMsg
  [/\.getErrorMgs\(/g, '.getErrorMsg('],
  [/\.getErorrMsg\(/g, '.getErrorMsg('],
];

// GlideSchedule method typos
const GLIDE_SCHEDULE_TYPOS = [
  // add
  [/\.addd\(/g, '.add('],
  [/\.ad\(/g, '.add('],
  [/\.adde\(/g, '.add('],
  [/\.aadd\(/g, '.add('],
  // setTimeZone
  [/\.setTimeZoen\(/g, '.setTimeZone('],
  [/\.setTimeZon\(/g, '.setTimeZone('],
  [/\.setTimZone\(/g, '.setTimeZone('],
  [/\.setTimeZonee\(/g, '.setTimeZone('],
  // duration
  [/\.duraiton\(/g, '.duration('],
  [/\.duraion\(/g, '.duration('],
  [/\.duratoin\(/g, '.duration('],
  [/\.durration\(/g, '.duration('],
  // getName
  [/\.getNmae\(/g, '.getName('],
  [/\.getNaem\(/g, '.getName('],
  [/\.getNam\(/g, '.getName('],
  [/\.getNamee\(/g, '.getName('],
  // isInSchedule
  [/\.isInSchedul\(/g, '.isInSchedule('],
  [/\.isInScedule\(/g, '.isInSchedule('],
  [/\.isInScheudule\(/g, '.isInSchedule('],
  [/\.isInSchedulee\(/g, '.isInSchedule('],
  // whenNext
  [/\.whenNex\(/g, '.whenNext('],
  [/\.wehnNext\(/g, '.whenNext('],
  [/\.whenNxet\(/g, '.whenNext('],
  [/\.whenNextt\(/g, '.whenNext('],
  // isValid
  [/\.isVlaid\(/g, '.isValid('],
  [/\.isValdi\(/g, '.isValid('],
  [/\.isVaild\(/g, '.isValid('],
  [/\.isValidd\(/g, '.isValid('],
  // load
  [/\.laod\(/g, '.load('],
  [/\.loda\(/g, '.load('],
  [/\.laoad\(/g, '.load('],
  [/\.loadd\(/g, '.load('],
];

// GlideDuration method typos
const GLIDE_DURATION_TYPOS = [
  // add
  [/\.addd\(/g, '.add('],
  [/\.ad\(/g, '.add('],
  [/\.adde\(/g, '.add('],
  [/\.aadd\(/g, '.add('],
  // getByFormat
  [/\.getByFromat\(/g, '.getByFormat('],
  [/\.getByFomrat\(/g, '.getByFormat('],
  [/\.getByForamt\(/g, '.getByFormat('],
  [/\.getByFormta\(/g, '.getByFormat('],
  // getDayPart
  [/\.getDayPrat\(/g, '.getDayPart('],
  [/\.getDyaPart\(/g, '.getDayPart('],
  [/\.getDayPart\(/g, '.getDayPart('],
  [/\.getDayprat\(/g, '.getDayPart('],
  // getDurationValue
  [/\.getDurationVlaue\(/g, '.getDurationValue('],
  [/\.getDurationValeu\(/g, '.getDurationValue('],
  [/\.getDuraitonValue\(/g, '.getDurationValue('],
  [/\.getDuratoinValue\(/g, '.getDurationValue('],
  // getNumericValue
  [/\.getNumericVlaue\(/g, '.getNumericValue('],
  [/\.getNumericValeu\(/g, '.getNumericValue('],
  [/\.getNumeircValue\(/g, '.getNumericValue('],
  [/\.getNuemricValue\(/g, '.getNumericValue('],
  // getRoundedDayPart
  [/\.getRoundedDayPrat\(/g, '.getRoundedDayPart('],
  [/\.getRoundedDyaPart\(/g, '.getRoundedDayPart('],
  [/\.getRoudnedDayPart\(/g, '.getRoundedDayPart('],
  [/\.getRoundedDayPart\(/g, '.getRoundedDayPart('],
  // getValue
  [/\.getValeu\(/g, '.getValue('],
  [/\.getVlaue\(/g, '.getValue('],
  [/\.getValu\(/g, '.getValue('],
  [/\.getVale\(/g, '.getValue('],
  // setDisplayValue
  [/\.setDisplayVlaue\(/g, '.setDisplayValue('],
  [/\.setDispalyValue\(/g, '.setDisplayValue('],
  [/\.setDisplayValeu\(/g, '.setDisplayValue('],
  [/\.setDislpayValue\(/g, '.setDisplayValue('],
  // setValue
  [/\.setValeu\(/g, '.setValue('],
  [/\.setVlaue\(/g, '.setValue('],
  [/\.setValu\(/g, '.setValue('],
  [/\.setVale\(/g, '.setValue('],
  // subtract
  [/\.subtarct\(/g, '.subtract('],
  [/\.substract\(/g, '.subtract('],
  [/\.subtact\(/g, '.subtract('],
  [/\.subract\(/g, '.subtract('],
];

// GlideUser / gs.getUser() method typos
const GLIDE_USER_TYPOS = [
  // getID
  [/\.getId\(/g, '.getID('],
  [/\.getid\(/g, '.getID('],
  [/\.getIDD\(/g, '.getID('],
  [/\.gtID\(/g, '.getID('],
  // getUserID
  [/\.getUserId\(/g, '.getUserID('],
  [/\.getUsrID\(/g, '.getUserID('],
  [/\.getUserIDd\(/g, '.getUserID('],
  [/\.getUserdi\(/g, '.getUserID('],
  // getName
  [/\.getNmae\(/g, '.getName('],
  [/\.getNaem\(/g, '.getName('],
  [/\.getNam\(/g, '.getName('],
  [/\.getNamee\(/g, '.getName('],
  // getUserName
  [/\.getUserNmae\(/g, '.getUserName('],
  [/\.getUserNaem\(/g, '.getUserName('],
  [/\.getUsreName\(/g, '.getUserName('],
  [/\.getUserNamee\(/g, '.getUserName('],
  // getDisplayName
  [/\.getDisplayNmae\(/g, '.getDisplayName('],
  [/\.getDisplayNaem\(/g, '.getDisplayName('],
  [/\.getDiplayName\(/g, '.getDisplayName('],
  [/\.getDispayName\(/g, '.getDisplayName('],
  // getEmail
  [/\.getEmial\(/g, '.getEmail('],
  [/\.getEamil\(/g, '.getEmail('],
  [/\.getEmai\(/g, '.getEmail('],
  [/\.getEmaill\(/g, '.getEmail('],
  // getFirstName
  [/\.getFristName\(/g, '.getFirstName('],
  [/\.getFirstNmae\(/g, '.getFirstName('],
  [/\.getFisrtName\(/g, '.getFirstName('],
  [/\.getFirstNaem\(/g, '.getFirstName('],
  // getLastName
  [/\.getLastNmae\(/g, '.getLastName('],
  [/\.getLatsName\(/g, '.getLastName('],
  [/\.getLastNaem\(/g, '.getLastName('],
  [/\.getLstName\(/g, '.getLastName('],
  // getFullName
  [/\.getFullNmae\(/g, '.getFullName('],
  [/\.getFullNaem\(/g, '.getFullName('],
  [/\.getFulName\(/g, '.getFullName('],
  [/\.getFullNamee\(/g, '.getFullName('],
  // getCompanyID
  [/\.getCompanyId\(/g, '.getCompanyID('],
  [/\.getCompnayID\(/g, '.getCompanyID('],
  [/\.getComapnyID\(/g, '.getCompanyID('],
  [/\.getComanpyID\(/g, '.getCompanyID('],
  // getDepartmentID
  [/\.getDepartmentId\(/g, '.getDepartmentID('],
  [/\.getDepartmetID\(/g, '.getDepartmentID('],
  [/\.getDepartmetnID\(/g, '.getDepartmentID('],
  [/\.getDprtmntID\(/g, '.getDepartmentID('],
  // getDomainID
  [/\.getDomainId\(/g, '.getDomainID('],
  [/\.getDomianID\(/g, '.getDomainID('],
  [/\.getDoaminID\(/g, '.getDomainID('],
  [/\.getDomainIDd\(/g, '.getDomainID('],
  // getLocation
  [/\.getLocaiton\(/g, '.getLocation('],
  [/\.getLocatoin\(/g, '.getLocation('],
  [/\.getLoacation\(/g, '.getLocation('],
  [/\.getLoaction\(/g, '.getLocation('],
  // getManagerID
  [/\.getManagerId\(/g, '.getManagerID('],
  [/\.getMangaerID\(/g, '.getManagerID('],
  [/\.getMangerID\(/g, '.getManagerID('],
  [/\.getManaegrID\(/g, '.getManagerID('],
  // getPreference
  [/\.getPrefernce\(/g, '.getPreference('],
  [/\.getPreferecne\(/g, '.getPreference('],
  [/\.getPreferenc\(/g, '.getPreference('],
  [/\.getPreferenec\(/g, '.getPreference('],
  // getRecord
  [/\.getRecrod\(/g, '.getRecord('],
  [/\.getReocrd\(/g, '.getRecord('],
  [/\.getRecodr\(/g, '.getRecord('],
  [/\.getRceord\(/g, '.getRecord('],
  // getRoles
  [/\.getRoels\(/g, '.getRoles('],
  [/\.getRoles\(/g, '.getRoles('],
  [/\.getRole\(/g, '.getRoles('],
  [/\.getRoesl\(/g, '.getRoles('],
  // hasRole
  [/\.hasRoel\(/g, '.hasRole('],
  [/\.hasRoal\(/g, '.hasRole('],
  [/\.hasRle\(/g, '.hasRole('],
  [/\.hasRolee\(/g, '.hasRole('],
  // hasRoleExactly
  [/\.hasRoleExatcly\(/g, '.hasRoleExactly('],
  [/\.hasRoleExaclty\(/g, '.hasRoleExactly('],
  [/\.hasRoelExactly\(/g, '.hasRoleExactly('],
  [/\.hasRoleExactlyy\(/g, '.hasRoleExactly('],
  // hasRoleInGroup
  [/\.hasRoleInGruop\(/g, '.hasRoleInGroup('],
  [/\.hasRoleInGrop\(/g, '.hasRoleInGroup('],
  [/\.hasRoleInGourp\(/g, '.hasRoleInGroup('],
  [/\.hasRoelInGroup\(/g, '.hasRoleInGroup('],
  // hasRoleFromList
  [/\.hasRoleFromLsit\(/g, '.hasRoleFromList('],
  [/\.hasRoleFromLits\(/g, '.hasRoleFromList('],
  [/\.hasRoleFrmList\(/g, '.hasRoleFromList('],
  [/\.hasRoleFormList\(/g, '.hasRoleFromList('],
  // isMemberOf
  [/\.isMemberOF\(/g, '.isMemberOf('],
  [/\.isMemeberOf\(/g, '.isMemberOf('],
  [/\.isMebmerOf\(/g, '.isMemberOf('],
  [/\.isMemebrOf\(/g, '.isMemberOf('],
  // savePreference
  [/\.savePrefernce\(/g, '.savePreference('],
  [/\.savePreferecne\(/g, '.savePreference('],
  [/\.savePreferenc\(/g, '.savePreference('],
  [/\.savePrference\(/g, '.savePreference('],
];

// GlideSession method typos
const GLIDE_SESSION_TYPOS = [
  // getClientIP
  [/\.getClientIp\(/g, '.getClientIP('],
  [/\.getClienIP\(/g, '.getClientIP('],
  [/\.getClientp\(/g, '.getClientIP('],
  [/\.getClietnIP\(/g, '.getClientIP('],
  // getClientData
  [/\.getClientDta\(/g, '.getClientData('],
  [/\.getClienData\(/g, '.getClientData('],
  [/\.getClientDaat\(/g, '.getClientData('],
  [/\.getClietnData\(/g, '.getClientData('],
  // getCurrentApplicationId
  [/\.getCurrentApplicationid\(/g, '.getCurrentApplicationId('],
  [/\.getCurretnApplicationId\(/g, '.getCurrentApplicationId('],
  [/\.getCurrentApplicaitonId\(/g, '.getCurrentApplicationId('],
  [/\.getCurrentAppliationId\(/g, '.getCurrentApplicationId('],
  // getCurrentApplicationScope
  [/\.getCurrentApplicationScop\(/g, '.getCurrentApplicationScope('],
  [/\.getCurretnApplicationScope\(/g, '.getCurrentApplicationScope('],
  [/\.getCurrentApplicaitonScope\(/g, '.getCurrentApplicationScope('],
  [/\.getCurrentApplicationScoep\(/g, '.getCurrentApplicationScope('],
  // getCurrentDomainID
  [/\.getCurrentDomainId\(/g, '.getCurrentDomainID('],
  [/\.getCurretnDomainID\(/g, '.getCurrentDomainID('],
  [/\.getCurrentDomianID\(/g, '.getCurrentDomainID('],
  [/\.getCurrentDoaminID\(/g, '.getCurrentDomainID('],
  // getLanguage
  [/\.getLanguge\(/g, '.getLanguage('],
  [/\.getLangauge\(/g, '.getLanguage('],
  [/\.getLnguage\(/g, '.getLanguage('],
  [/\.getLangauge\(/g, '.getLanguage('],
  // getSessionToken
  [/\.getSessionTkoen\(/g, '.getSessionToken('],
  [/\.getSessionToekn\(/g, '.getSessionToken('],
  [/\.getSesionToken\(/g, '.getSessionToken('],
  [/\.getSessionTokne\(/g, '.getSessionToken('],
  // getSessionID
  [/\.getSessionId\(/g, '.getSessionID('],
  [/\.getSesionID\(/g, '.getSessionID('],
  [/\.getSessionIDd\(/g, '.getSessionID('],
  [/\.getSeessionID\(/g, '.getSessionID('],
  // getTimeZoneName
  [/\.getTimeZoneNmae\(/g, '.getTimeZoneName('],
  [/\.getTimzeZoneName\(/g, '.getTimeZoneName('],
  [/\.getTimeZoneNaem\(/g, '.getTimeZoneName('],
  [/\.getTimeZoenName\(/g, '.getTimeZoneName('],
  // getUrlOnStack
  [/\.getUrlOnStcak\(/g, '.getUrlOnStack('],
  [/\.getUrlOnStakc\(/g, '.getUrlOnStack('],
  [/\.getUrlOnStck\(/g, '.getUrlOnStack('],
  [/\.getURlOnStack\(/g, '.getUrlOnStack('],
  // isInteractive
  [/\.isInteratcive\(/g, '.isInteractive('],
  [/\.isInteractvie\(/g, '.isInteractive('],
  [/\.isIntreactive\(/g, '.isInteractive('],
  [/\.isInteractivee\(/g, '.isInteractive('],
  // isLoggedIn
  [/\.isLogedIn\(/g, '.isLoggedIn('],
  [/\.isLoggedin\(/g, '.isLoggedIn('],
  [/\.isLoggedinn\(/g, '.isLoggedIn('],
  [/\.isLoggdIn\(/g, '.isLoggedIn('],
  // isMobile
  [/\.isMobiel\(/g, '.isMobile('],
  [/\.isMoblile\(/g, '.isMobile('],
  [/\.isMobilee\(/g, '.isMobile('],
  [/\.isMboile\(/g, '.isMobile('],
  // putClientData
  [/\.putClientDta\(/g, '.putClientData('],
  [/\.putClienData\(/g, '.putClientData('],
  [/\.putClientDaat\(/g, '.putClientData('],
  [/\.putClinetData\(/g, '.putClientData('],
  // setClientData
  [/\.setClientDta\(/g, '.setClientData('],
  [/\.setClienData\(/g, '.setClientData('],
  [/\.setClientDaat\(/g, '.setClientData('],
  [/\.setClietnData\(/g, '.setClientData('],
  // getUser
  [/\.getUsr\(/g, '.getUser('],
  [/\.getUesr\(/g, '.getUser('],
  [/\.getUserr\(/g, '.getUser('],
  [/\.gtUser\(/g, '.getUser('],
  // getRoles
  [/\.getRoels\(/g, '.getRoles('],
  [/\.getRoesl\(/g, '.getRoles('],
  [/\.getRoless\(/g, '.getRoles('],
  [/\.getRole\(/g, '.getRoles('],
  // isImpersonating
  [/\.isImpersonatign\(/g, '.isImpersonating('],
  [/\.isImpersonatnig\(/g, '.isImpersonating('],
  [/\.isImeprsonate\(/g, '.isImpersonating('],
  [/\.isImpersonatingg\(/g, '.isImpersonating('],
  // clearClientData
  [/\.clearClientDta\(/g, '.clearClientData('],
  [/\.clearClienData\(/g, '.clearClientData('],
  [/\.claerClientData\(/g, '.clearClientData('],
  [/\.clearClietnData\(/g, '.clearClientData('],
];

// sn_ws (REST/SOAP) method typos
const SN_WS_TYPOS = [
  // setRequestBody
  [/\.setRequestBdoy\(/g, '.setRequestBody('],
  [/\.setRequestBoy\(/g, '.setRequestBody('],
  [/\.setReqeustBody\(/g, '.setRequestBody('],
  [/\.setRequestBoyy\(/g, '.setRequestBody('],
  // setHttpMethod
  [/\.setHttpMehtod\(/g, '.setHttpMethod('],
  [/\.setHttpMetod\(/g, '.setHttpMethod('],
  [/\.setHTTPMethod\(/g, '.setHttpMethod('],
  [/\.setHttpMethdo\(/g, '.setHttpMethod('],
  // setEndpoint
  [/\.setEndpoitn\(/g, '.setEndpoint('],
  [/\.setEndpont\(/g, '.setEndpoint('],
  [/\.setEndPiont\(/g, '.setEndpoint('],
  [/\.setEndpooint\(/g, '.setEndpoint('],
  // getBody (REST_RESPONSE_V2)
  [/\.getBdoy\(/g, '.getBody('],
  [/\.getBoyd\(/g, '.getBody('],
  [/\.getBodyy\(/g, '.getBody('],
  [/\.gtBody\(/g, '.getBody('],
  // getStatusCode
  [/\.getStatsuCode\(/g, '.getStatusCode('],
  [/\.getStatusCoe\(/g, '.getStatusCode('],
  [/\.getStatusCdoe\(/g, '.getStatusCode('],
  [/\.getStautsCode\(/g, '.getStatusCode('],
  // setRequestHeader
  [/\.setRequestHader\(/g, '.setRequestHeader('],
  [/\.setRequestHeaer\(/g, '.setRequestHeader('],
  [/\.setRequsetHeader\(/g, '.setRequestHeader('],
  [/\.setReqeustHeader\(/g, '.setRequestHeader('],
  // getRequestHeader
  [/\.getRequestHader\(/g, '.getRequestHeader('],
  [/\.getRequestHeaer\(/g, '.getRequestHeader('],
  [/\.getRequsetHeader\(/g, '.getRequestHeader('],
  [/\.getReqeustHeader\(/g, '.getRequestHeader('],
  // getHeader (REST_RESPONSE_V2)
  [/\.getHader\(/g, '.getHeader('],
  [/\.getHeaer\(/g, '.getHeader('],
  [/\.getHeeader\(/g, '.getHeader('],
  [/\.getHeaedr\(/g, '.getHeader('],
  // setBasicAuth
  [/\.setBasciAuth\(/g, '.setBasicAuth('],
  [/\.setBasicAth\(/g, '.setBasicAuth('],
  [/\.setBasicAtuh\(/g, '.setBasicAuth('],
  [/\.setBascAuth\(/g, '.setBasicAuth('],
  // setMIDServer
  [/\.setMIDServr\(/g, '.setMIDServer('],
  [/\.setMidServer\(/g, '.setMIDServer('],
  [/\.setMIDServeer\(/g, '.setMIDServer('],
  [/\.setMIDSever\(/g, '.setMIDServer('],
  // setQueryParameter
  [/\.setQueryParamter\(/g, '.setQueryParameter('],
  [/\.setQueryParmeter\(/g, '.setQueryParameter('],
  [/\.setQueryParametr\(/g, '.setQueryParameter('],
  [/\.setQueryParmaeter\(/g, '.setQueryParameter('],
  // execute
  [/\.excute\(/g, '.execute('],
  [/\.exeucte\(/g, '.execute('],
  [/\.execut\(/g, '.execute('],
  [/\.exectue\(/g, '.execute('],
  // executeAsync
  [/\.excuteAsync\(/g, '.executeAsync('],
  [/\.executeAsnc\(/g, '.executeAsync('],
  [/\.executeAsnyc\(/g, '.executeAsync('],
  [/\.exeucteAsync\(/g, '.executeAsync('],
];

// ArrayUtil method typos
const ARRAY_UTIL_TYPOS = [
  [/\.contians\(/g, '.contains('],
  [/\.contins\(/g, '.contains('],
  [/\.cotains\(/g, '.contains('],
  [/\.concta\(/g, '.concat('],
  [/\.conact\(/g, '.concat('],
  [/\.unqiue\(/g, '.unique('],
  [/\.uniqe\(/g, '.unique('],
  [/\.uniqeu\(/g, '.unique('],
  [/\.differnce\(/g, '.diff('],
  [/\.diference\(/g, '.diff('],
  [/\.differecne\(/g, '.diff('],
  [/\.intersction\(/g, '.intersect('],
  [/\.interesct\(/g, '.intersect('],
  [/\.intsersect\(/g, '.intersect('],
  [/\.unioin\(/g, '.union('],
  [/\.uion\(/g, '.union('],
  [/\.indexof\(/g, '.indexOf('],
  [/\.idnexOf\(/g, '.indexOf('],
];

// GlideSysAttachment method typos
const GLIDE_SYS_ATTACHMENT_TYPOS = [
  [/\.wirte\(/g, '.write('],
  [/\.wrtie\(/g, '.write('],
  [/\.writ\(/g, '.write('],
  [/\.getContetnt\(/g, '.getContent('],
  [/\.getContnet\(/g, '.getContent('],
  [/\.getCotent\(/g, '.getContent('],
  [/\.getContetnStream\(/g, '.getContentStream('],
  [/\.getContentStrem\(/g, '.getContentStream('],
  [/\.deleteAttachement\(/g, '.deleteAttachment('],
  [/\.deletAttachment\(/g, '.deleteAttachment('],
  [/\.deleteAtachment\(/g, '.deleteAttachment('],
  [/\.cpoy\(/g, '.copy('],
  [/\.coyp\(/g, '.copy('],
  [/\.getContentBase46\(/g, '.getContentBase64('],
  [/\.getContentBas64\(/g, '.getContentBase64('],
  [/\.writeBase46\(/g, '.writeBase64('],
  [/\.wirteBas64\(/g, '.writeBase64('],
];

// g_form method typos
const G_FORM_TYPOS = [
  [/\.setMandaotry\(/g, '.setMandatory('],
  [/\.setMandtory\(/g, '.setMandatory('],
  [/\.setManadtory\(/g, '.setMandatory('],
  [/\.setMandatroy\(/g, '.setMandatory('],
  [/\.setVisiblity\(/g, '.setVisible('],
  [/\.setVisble\(/g, '.setVisible('],
  [/\.setVisbile\(/g, '.setVisible('],
  [/\.setReadOnyl\(/g, '.setReadOnly('],
  [/\.setReadOlny\(/g, '.setReadOnly('],
  [/\.setRaedOnly\(/g, '.setReadOnly('],
  [/\.setReadOnlly\(/g, '.setReadOnly('],
  [/\.showFieldMesg\(/g, '.showFieldMsg('],
  [/\.showFiedlMsg\(/g, '.showFieldMsg('],
  [/\.showFieldMessg\(/g, '.showFieldMsg('],
  [/\.showFieldMgs\(/g, '.showFieldMsg('],
  [/\.addOptin\(/g, '.addOption('],
  [/\.addOpiton\(/g, '.addOption('],
  [/\.addOptoin\(/g, '.addOption('],
  [/\.removeOptin\(/g, '.removeOption('],
  [/\.removeOpiton\(/g, '.removeOption('],
  [/\.removeOptoin\(/g, '.removeOption('],
  [/\.clearOptins\(/g, '.clearOptions('],
  [/\.clearOptoins\(/g, '.clearOptions('],
  [/\.clearOpitons\(/g, '.clearOptions('],
  [/\.clearMessaegs\(/g, '.clearMessages('],
  [/\.clearMessgaes\(/g, '.clearMessages('],
  [/\.clearMesages\(/g, '.clearMessages('],
  [/\.hideFieldMesg\(/g, '.hideFieldMsg('],
  [/\.hideFiedlMsg\(/g, '.hideFieldMsg('],
  [/\.hideRelatedLsit\(/g, '.hideRelatedList('],
  [/\.hideRealtedList\(/g, '.hideRelatedList('],
  [/\.showRelatedLsit\(/g, '.showRelatedList('],
  [/\.showRealtedList\(/g, '.showRelatedList('],
  [/g_form\.getRefrence\(/g, 'g_form.getReference('],
  [/g_form\.getReferecne\(/g, 'g_form.getReference('],
  [/\.falsh\(/g, '.flash('],
  [/\.flsah\(/g, '.flash('],
  [/\.addInfoMessge\(/g, '.addInfoMessage('],
  [/\.addInfoMesage\(/g, '.addInfoMessage('],
  [/\.addErrorMessge\(/g, '.addErrorMessage('],
  [/\.addErrorMesage\(/g, '.addErrorMessage('],
  [/\.getContrl\(/g, '.getControl('],
  [/\.getContorl\(/g, '.getControl('],
  [/\.getLableOf\(/g, '.getLabelOf('],
  [/\.getLabellOf\(/g, '.getLabelOf('],
  [/\.setLableOf\(/g, '.setLabelOf('],
  [/\.setLabellOf\(/g, '.setLabelOf('],
  [/\.addDecoraton\(/g, '.addDecoration('],
  [/\.addDecoratoin\(/g, '.addDecoration('],
  [/\.removeDecoraton\(/g, '.removeDecoration('],
  [/\.removeDecoratoin\(/g, '.removeDecoration('],
  [/\.clearVlaue\(/g, '.clearValue('],
  [/\.clearValu\(/g, '.clearValue('],
  [/\.isVisble\(/g, '.isVisible('],
  [/\.isMandatroy\(/g, '.isMandatory('],
  [/\.setDisabeld\(/g, '.setDisabled('],
  [/\.setDisbled\(/g, '.setDisabled('],
];

// g_user method typos
const G_USER_TYPOS = [
  [/g_user\.hasRoel\(/g, 'g_user.hasRole('],
  [/g_user\.hasRoal\(/g, 'g_user.hasRole('],
  [/g_user\.haRoleExactly\(/g, 'g_user.hasRoleExactly('],
  [/g_user\.hasRoleExatcly\(/g, 'g_user.hasRoleExactly('],
  [/g_user\.getUserNmae\(/g, 'g_user.getUserName('],
  [/g_user\.getUserNaem\(/g, 'g_user.getUserName('],
  [/g_user\.getFulName\(/g, 'g_user.getFullName('],
  [/g_user\.getFullNmae\(/g, 'g_user.getFullName('],
  [/g_user\.hasRoleFormList\(/g, 'g_user.hasRoleFromList('],
  [/g_user\.hasRoleFrmList\(/g, 'g_user.hasRoleFromList('],
];

// GlideAjax method typos
const GLIDE_AJAX_TYPOS = [
  [/\.addParm\(/g, '.addParam('],
  [/\.addPrama\(/g, '.addParam('],
  [/\.addParem\(/g, '.addParam('],
  [/\.addParma\(/g, '.addParam('],
  [/\.getXMLWiat\(/g, '.getXMLWait('],
  [/\.getXMLWai\(/g, '.getXMLWait('],
  [/\.getXmlWait\(/g, '.getXMLWait('],
  [/\.getXMLwait\(/g, '.getXMLWait('],
  [/\.getxmlwait\(/g, '.getXMLWait('],
  [/\.getXMLAnwser\(/g, '.getXMLAnswer('],
  [/\.getXMLAnsewr\(/g, '.getXMLAnswer('],
  [/\.getXmlAnswer\(/g, '.getXMLAnswer('],
  [/\.getAnwser\(/g, '.getAnswer('],
  [/\.getAnsewr\(/g, '.getAnswer('],
  // getParameter typos (for Script Include processors)
  [/\.getParamater\(/g, '.getParameter('],
  [/\.getParametr\(/g, '.getParameter('],
  [/\.getParamter\(/g, '.getParameter('],
  [/\.getParmeter\(/g, '.getParameter('],
  [/\.getParaemter\(/g, '.getParameter('],
];

// gs (GlideSystem) method typos
const GS_TYPOS = [
  [/gs\.getPrefernce\(/g, 'gs.getPreference('],
  [/gs\.getPreferecne\(/g, 'gs.getPreference('],
  [/gs\.setPrefernce\(/g, 'gs.setPreference('],
  [/gs\.setPreferecne\(/g, 'gs.setPreference('],
  [/gs\.addInfoMessge\(/g, 'gs.addInfoMessage('],
  [/gs\.addInfoMesage\(/g, 'gs.addInfoMessage('],
  [/gs\.addInofMessage\(/g, 'gs.addInfoMessage('],
  [/gs\.addErrorMessge\(/g, 'gs.addErrorMessage('],
  [/gs\.addErrorMesage\(/g, 'gs.addErrorMessage('],
  [/gs\.addErorrMessage\(/g, 'gs.addErrorMessage('],
  [/gs\.getProprety\(/g, 'gs.getProperty('],
  [/gs\.getPropety\(/g, 'gs.getProperty('],
  [/gs\.getPropert\(/g, 'gs.getProperty('],
  [/gs\.setProprety\(/g, 'gs.setProperty('],
  [/gs\.setPropety\(/g, 'gs.setProperty('],
  [/gs\.getUserId\(/g, 'gs.getUserID('],
  [/gs\.getUsrID\(/g, 'gs.getUserID('],
  [/gs\.getUserNmae\(/g, 'gs.getUserName('],
  [/gs\.getUserNaem\(/g, 'gs.getUserName('],
  [/gs\.getUsr\(/g, 'gs.getUser('],
  [/gs\.getUesr\(/g, 'gs.getUser('],
  [/gs\.hasRoel\(/g, 'gs.hasRole('],
  [/gs\.hasRoal\(/g, 'gs.hasRole('],
  [/gs\.lgo\(/g, 'gs.log('],
  [/gs\.olg\(/g, 'gs.log('],
  [/gs\.inof\(/g, 'gs.info('],
  [/gs\.inf\(/g, 'gs.info('],
  [/gs\.debgu\(/g, 'gs.debug('],
  [/gs\.deubg\(/g, 'gs.debug('],
  [/gs\.erorr\(/g, 'gs.error('],
  [/gs\.erro\(/g, 'gs.error('],
  [/gs\.wran\(/g, 'gs.warn('],
  [/gs\.warrn\(/g, 'gs.warn('],
  [/gs\.pirnt\(/g, 'gs.print('],
  [/gs\.pritn\(/g, 'gs.print('],
  [/gs\.nill\(/g, 'gs.nil('],
  [/gs\.nli\(/g, 'gs.nil('],
  [/gs\.tableExits\(/g, 'gs.tableExists('],
  [/gs\.tabelExists\(/g, 'gs.tableExists('],
  [/gs\.getMessge\(/g, 'gs.getMessage('],
  [/gs\.getMesage\(/g, 'gs.getMessage('],
  [/gs\.eventQueu\(/g, 'gs.eventQueue('],
  [/gs\.evnetQueue\(/g, 'gs.eventQueue('],
  [/gs\.beginingOfLastMonth\(/g, 'gs.beginningOfLastMonth('],
  [/gs\.beginningOfLatsMonth\(/g, 'gs.beginningOfLastMonth('],
  [/gs\.beginingOfThisMonth\(/g, 'gs.beginningOfThisMonth('],
  [/gs\.getCurrentScopeNmae\(/g, 'gs.getCurrentScopeName('],
  [/gs\.getCurentScopeName\(/g, 'gs.getCurrentScopeName('],
  [/gs\.urlEncdoe\(/g, 'gs.urlEncode('],
  [/gs\.urlDecdoe\(/g, 'gs.urlDecode('],
  [/gs\.xmlToJOSN\(/g, 'gs.xmlToJSON('],
  [/gs\.xmlTOJSON\(/g, 'gs.xmlToJSON('],
  // getDisplayName
  [/gs\.getDisplayNmae\(/g, 'gs.getDisplayName('],
  [/gs\.getDisplayNaem\(/g, 'gs.getDisplayName('],
  // getCurrentScopeName
  [/gs\.getCurrentScopeNmae\(/g, 'gs.getCurrentScopeName('],
  [/gs\.getCurentScopeName\(/g, 'gs.getCurrentScopeName('],
  // getSession
  [/gs\.getSesion\(/g, 'gs.getSession('],
  [/gs\.getSesson\(/g, 'gs.getSession('],
  // getTimeZoneName
  [/gs\.getTimeZoneNmae\(/g, 'gs.getTimeZoneName('],
  [/gs\.getTimZoneName\(/g, 'gs.getTimeZoneName('],
  // hoursAgo
  [/gs\.hoursAgo\(/g, 'gs.hoursAgo('],
  [/gs\.horusAgo\(/g, 'gs.hoursAgo('],
  // hoursAgoStart
  [/gs\.hoursAgoStrat\(/g, 'gs.hoursAgoStart('],
  [/gs\.horusAgoStart\(/g, 'gs.hoursAgoStart('],
  // hoursAgoEnd
  [/gs\.hoursAgoEdn\(/g, 'gs.hoursAgoEnd('],
  [/gs\.horusAgoEnd\(/g, 'gs.hoursAgoEnd('],
  // daysAgo
  [/gs\.daysAgo\(/g, 'gs.daysAgo('],
  [/gs\.daysAgo\(/g, 'gs.daysAgo('],
  [/gs\.daysago\(/g, 'gs.daysAgo('],
  // daysAgoStart
  [/gs\.daysAgoStrat\(/g, 'gs.daysAgoStart('],
  [/gs\.daysAgoStrt\(/g, 'gs.daysAgoStart('],
  // daysAgoEnd
  [/gs\.daysAgoEdn\(/g, 'gs.daysAgoEnd('],
  [/gs\.daysAgoEdn\(/g, 'gs.daysAgoEnd('],
  // monthsAgo
  [/gs\.monthsAgo\(/g, 'gs.monthsAgo('],
  [/gs\.monthsago\(/g, 'gs.monthsAgo('],
  [/gs\.montshAgo\(/g, 'gs.monthsAgo('],
  // monthsAgoStart
  [/gs\.monthsAgoStrat\(/g, 'gs.monthsAgoStart('],
  [/gs\.montshAgoStart\(/g, 'gs.monthsAgoStart('],
  // quartersAgo
  [/gs\.quartersago\(/g, 'gs.quartersAgo('],
  [/gs\.quartersAgo\(/g, 'gs.quartersAgo('],
  // yearsAgo
  [/gs\.yearsago\(/g, 'gs.yearsAgo('],
  [/gs\.yaersAgo\(/g, 'gs.yearsAgo('],
  // beginningOfLastMonth
  [/gs\.beginningOfLatsMonth\(/g, 'gs.beginningOfLastMonth('],
  [/gs\.beginingOfLastMonth\(/g, 'gs.beginningOfLastMonth('],
  // beginningOfLastWeek
  [/gs\.beginningOfLatsWeek\(/g, 'gs.beginningOfLastWeek('],
  [/gs\.beginingOfLastWeek\(/g, 'gs.beginningOfLastWeek('],
  // beginningOfLastYear
  [/gs\.beginningOfLatsYear\(/g, 'gs.beginningOfLastYear('],
  [/gs\.beginingOfLastYear\(/g, 'gs.beginningOfLastYear('],
  // beginningOfThisMonth
  [/gs\.beginningOfThisMont\(/g, 'gs.beginningOfThisMonth('],
  [/gs\.beginingOfThisMonth\(/g, 'gs.beginningOfThisMonth('],
  // beginningOfThisQuarter
  [/gs\.beginningOfThisQuater\(/g, 'gs.beginningOfThisQuarter('],
  [/gs\.beginingOfThisQuarter\(/g, 'gs.beginningOfThisQuarter('],
  // beginningOfThisWeek
  [/gs\.beginningOfThisWeke\(/g, 'gs.beginningOfThisWeek('],
  [/gs\.beginingOfThisWeek\(/g, 'gs.beginningOfThisWeek('],
  // beginningOfThisYear
  [/gs\.beginningOfThisYaer\(/g, 'gs.beginningOfThisYear('],
  [/gs\.beginingOfThisYear\(/g, 'gs.beginningOfThisYear('],
  // endOfLastMonth
  [/gs\.endOfLatsMonth\(/g, 'gs.endOfLastMonth('],
  [/gs\.endOfLastMont\(/g, 'gs.endOfLastMonth('],
  // endOfLastWeek
  [/gs\.endOfLatsWeek\(/g, 'gs.endOfLastWeek('],
  [/gs\.endOfLastWeke\(/g, 'gs.endOfLastWeek('],
  // endOfLastYear
  [/gs\.endOfLatsYear\(/g, 'gs.endOfLastYear('],
  [/gs\.endOfLastYaer\(/g, 'gs.endOfLastYear('],
  // endOfThisMonth
  [/gs\.endOfThisMont\(/g, 'gs.endOfThisMonth('],
  [/gs\.endOfThisMOnth\(/g, 'gs.endOfThisMonth('],
  // endOfThisQuarter
  [/gs\.endOfThisQuater\(/g, 'gs.endOfThisQuarter('],
  [/gs\.endOfThisQuaarter\(/g, 'gs.endOfThisQuarter('],
  // endOfThisWeek
  [/gs\.endOfThisWeke\(/g, 'gs.endOfThisWeek('],
  [/gs\.endOfThisWek\(/g, 'gs.endOfThisWeek('],
  // endOfThisYear
  [/gs\.endOfThisYaer\(/g, 'gs.endOfThisYear('],
  [/gs\.endOfThisYera\(/g, 'gs.endOfThisYear('],
  // generateGUID
  [/gs\.generateGUId\(/g, 'gs.generateGUID('],
  [/gs\.genreateGUID\(/g, 'gs.generateGUID('],
  // getCallerScopeName
  [/gs\.getCallerScopeNmae\(/g, 'gs.getCallerScopeName('],
  [/gs\.getCalelrScopeName\(/g, 'gs.getCallerScopeName('],
  // flushMessages
  [/gs\.flushMessgaes\(/g, 'gs.flushMessages('],
  [/gs\.flsuhMessages\(/g, 'gs.flushMessages('],
  // include
  [/gs\.incldue\(/g, 'gs.include('],
  [/gs\.inlcude\(/g, 'gs.include('],
  // isDebugging
  [/gs\.isDebuging\(/g, 'gs.isDebugging('],
  [/gs\.isDbugging\(/g, 'gs.isDebugging('],
  // isInteractive
  [/gs\.isInteratcive\(/g, 'gs.isInteractive('],
  [/gs\.isIntreactive\(/g, 'gs.isInteractive('],
  // isLoggedIn
  [/gs\.isLogedIn\(/g, 'gs.isLoggedIn('],
  [/gs\.isLoggedinn\(/g, 'gs.isLoggedIn('],
  // isMobile
  [/gs\.isMobiel\(/g, 'gs.isMobile('],
  [/gs\.isMoblile\(/g, 'gs.isMobile('],
  // workflowFlush
  [/gs\.workflowFlsuh\(/g, 'gs.workflowFlush('],
  [/gs\.workflowFulsh\(/g, 'gs.workflowFlush('],
  // sleep
  [/gs\.slepe\(/g, 'gs.sleep('],
  [/gs\.slep\(/g, 'gs.sleep('],
  // base64Encode
  [/gs\.base64Encdoe\(/g, 'gs.base64Encode('],
  [/gs\.base46Encode\(/g, 'gs.base64Encode('],
  // base64Decode
  [/gs\.base64Decdoe\(/g, 'gs.base64Decode('],
  [/gs\.base46Decode\(/g, 'gs.base64Decode('],
  // dateDiff
  [/gs\.dateDif\(/g, 'gs.dateDiff('],
  [/gs\.dateDff\(/g, 'gs.dateDiff('],
  // dateGenerate
  [/gs\.dateGenrate\(/g, 'gs.dateGenerate('],
  [/gs\.datGeenerate\(/g, 'gs.dateGenerate('],
];

// Other ServiceNow class method typos
const OTHER_TYPOS = [
  // GlidePluginManager
  [/\.isActvie\(/g, '.isActive('],
  [/\.isAtcive\(/g, '.isActive('],
  [/\.isAcitve\(/g, '.isActive('],
  // GlideTableHierarchy
  [/\.getTableExentsions\(/g, '.getTableExtensions('],
  [/\.getTableExtnesions\(/g, '.getTableExtensions('],
  [/\.getBaes\(/g, '.getBase('],
  [/\.getBse\(/g, '.getBase('],
  [/\.getTabels\(/g, '.getTables('],
  [/\.getTabel\(/g, '.getTables('],
  [/\.getHiearchy\(/g, '.getHierarchy('],
  [/\.getHeirarchy\(/g, '.getHierarchy('],
  [/\.getAllExentsions\(/g, '.getAllExtensions('],
  [/\.getAllExtnesions\(/g, '.getAllExtensions('],
  // Workflow
  [/\.scratchapd\./g, '.scratchpad.'],
  [/\.scrtachpad\./g, '.scratchpad.'],
  [/\.scratcphad\./g, '.scratchpad.'],
  // GlideScriptedProcessor
  [/\.wrietOutput\(/g, '.writeOutput('],
  [/\.writeOuput\(/g, '.writeOutput('],
  [/\.writeOutpt\(/g, '.writeOutput('],
  // XMLDocument2
  [/\.parseXMl\(/g, '.parseXML('],
  [/\.parseXML\(/g, '.parseXML('],
  [/\.getDocuemntElement\(/g, '.getDocumentElement('],
  [/\.getDocumentElment\(/g, '.getDocumentElement('],
  [/\.createElementWithTextVlaue\(/g, '.createElementWithTextValue('],
  [/\.createEelmentWithTextValue\(/g, '.createElementWithTextValue('],
  [/\.getNodeNmae\(/g, '.getNodeName('],
  [/\.getNodeVlaue\(/g, '.getNodeValue('],
  [/\.getChildNodeIteraotr\(/g, '.getChildNodeIterator('],
  [/\.getChildNodeItertor\(/g, '.getChildNodeIterator('],
  // GlideEmailOutbound
  [/\.setSubejct\(/g, '.setSubject('],
  [/\.setSubjcet\(/g, '.setSubject('],
  [/\.setSubjetc\(/g, '.setSubject('],
  [/\.setSuject\(/g, '.setSubject('],
  [/\.setBdoy\(/g, '.setBody('],
  [/\.setBoyd\(/g, '.setBody('],
  [/\.setBodyy\(/g, '.setBody('],
  [/\.setBoyy\(/g, '.setBody('],
  [/\.addRecipeint\(/g, '.addRecipient('],
  [/\.addRecipent\(/g, '.addRecipient('],
  [/\.addReciepient\(/g, '.addRecipient('],
  [/\.addReciipient\(/g, '.addRecipient('],
  [/\.setFomr\(/g, '.setFrom('],
  [/\.setFromm\(/g, '.setFrom('],
  [/\.setFrmo\(/g, '.setFrom('],
  [/\.setFrm\(/g, '.setFrom('],
  [/\.setReplyTo\(/g, '.setReplyTo('],
  [/\.setRepltyTo\(/g, '.setReplyTo('],
  [/\.setReplyToo\(/g, '.setReplyTo('],
  [/\.setRelpyTo\(/g, '.setReplyTo('],
];

/**
 * Applies typo fixes from a list of patterns
 * @param {string} code - The code to process
 * @param {Array<[RegExp, string]>} typoList - List of [pattern, replacement] pairs
 * @returns {{ code: string, count: number }}
 */
function applyTypoFixes(code, typoList) {
  let processed = code;
  let count = 0;
  
  for (const [pattern, replacement] of typoList) {
    let matchCount = 0;
    processed = processed.replace(pattern, () => {
      matchCount++;
      return replacement;
    });
    count += matchCount;
  }
  
  return { code: processed, count };
}

/**
 * Applies ServiceNow-specific fixes to code
 * @param {string} code - The code to process
 * @returns {{ processed: string, fixes: string[] }}
 */
export function applyServiceNowFixes(code) {
  let processed = code;
  const fixes = [];

  // Apply typo corrections for each category
  const typoCategories = [
    { name: 'GlideRecord method', list: GLIDE_RECORD_TYPOS },
    { name: 'GlideElement method', list: GLIDE_ELEMENT_TYPOS },
    { name: 'ServiceNow class name', list: CLASS_NAME_TYPOS },
    { name: 'GlideDateTime method', list: GLIDE_DATETIME_TYPOS },
    { name: 'GlideSchedule method', list: GLIDE_SCHEDULE_TYPOS },
    { name: 'GlideDuration method', list: GLIDE_DURATION_TYPOS },
    { name: 'GlideUser method', list: GLIDE_USER_TYPOS },
    { name: 'GlideSession method', list: GLIDE_SESSION_TYPOS },
    { name: 'REST/SOAP method', list: SN_WS_TYPOS },
    { name: 'ArrayUtil method', list: ARRAY_UTIL_TYPOS },
    { name: 'GlideSysAttachment method', list: GLIDE_SYS_ATTACHMENT_TYPOS },
    { name: 'g_form method', list: G_FORM_TYPOS },
    { name: 'g_user method', list: G_USER_TYPOS },
    { name: 'GlideAjax method', list: GLIDE_AJAX_TYPOS },
    { name: 'gs method', list: GS_TYPOS },
    { name: 'ServiceNow API', list: OTHER_TYPOS },
  ];

  for (const category of typoCategories) {
    const result = applyTypoFixes(processed, category.list);
    processed = result.code;
    if (result.count > 0) {
      fixes.push(`Fixed ${result.count} ${category.name} typo${result.count > 1 ? 's' : ''}`);
    }
  }

  // Intelligent fix: Replace gs.now()
  const gsNowPattern = /\bgs\.now\s*\(\s*\)/g;
  const gsNowMatches = processed.match(gsNowPattern) || [];
  if (gsNowMatches.length > 0) {
    processed = processed.replace(gsNowPattern, 'new GlideDateTime().getDisplayValue()');
    fixes.push(`Replaced ${gsNowMatches.length} gs.now() with GlideDateTime`);
  }

  // Intelligent fix: Replace gs.nowDateTime()
  const gsNowDateTimePattern = /\bgs\.nowDateTime\s*\(\s*\)/g;
  const gsNowDateTimeMatches = processed.match(gsNowDateTimePattern) || [];
  if (gsNowDateTimeMatches.length > 0) {
    processed = processed.replace(gsNowDateTimePattern, 'new GlideDateTime().getValue()');
    fixes.push(`Replaced ${gsNowDateTimeMatches.length} gs.nowDateTime() with GlideDateTime`);
  }

  // Intelligent fix: getValue('sys_id') → getUniqueValue()
  const getSysIdPattern = /\.getValue\s*\(\s*['"]sys_id['"]\s*\)/g;
  const getSysIdMatches = processed.match(getSysIdPattern) || [];
  if (getSysIdMatches.length > 0) {
    processed = processed.replace(getSysIdPattern, '.getUniqueValue()');
    fixes.push(`Replaced ${getSysIdMatches.length} getValue('sys_id') with getUniqueValue()`);
  }

  // Intelligent fix: Replace gs.print()
  const gsPrintPattern = /\bgs\.print\s*\(/g;
  const gsPrintMatches = processed.match(gsPrintPattern) || [];
  if (gsPrintMatches.length > 0) {
    processed = processed.replace(gsPrintPattern, 'gs.info(');
    fixes.push(`Replaced ${gsPrintMatches.length} gs.print() with gs.info()`);
  }

  // Intelligent fix: String concatenation in addQuery
  const concatQueryPattern = /\.addQuery\s*\(\s*['"](\w+)=['"]\s*\+\s*(\w+)\s*\)/g;
  let concatCount = 0;
  processed = processed.replace(concatQueryPattern, (match, field, value) => {
    concatCount++;
    return `.addQuery('${field}', ${value})`;
  });
  if (concatCount > 0) {
    fixes.push(`Fixed ${concatCount} string concatenation in addQuery() calls`);
  }

  // Intelligent fix: Simple addEncodedQuery → addQuery
  const simpleEncodedPattern = /\.addEncodedQuery\s*\(\s*['"](\w+)=([^'^"]+)['"]\s*\)/g;
  let encodedCount = 0;
  processed = processed.replace(simpleEncodedPattern, (match, field, value) => {
    if (!value.includes('^') && !value.includes('!=') && !value.includes('LIKE') && 
        !value.includes('IN') && !value.includes('STARTSWITH') && !value.includes('ENDSWITH') &&
        !value.includes('CONTAINS') && !value.includes('ORDERBY') && !value.includes('NULL')) {
      encodedCount++;
      return `.addQuery('${field}', '${value}')`;
    }
    return match;
  });
  if (encodedCount > 0) {
    fixes.push(`Simplified ${encodedCount} addEncodedQuery() to addQuery()`);
  }

  // Intelligent fix: String literal loose equality to strict equality
  const stringEqualityPattern = /(['"][^'"]*['"])\s*==\s*(['"][^'"]*['"])/g;
  let strictCount = 0;
  processed = processed.replace(stringEqualityPattern, (match, left, right) => {
    strictCount++;
    return `${left} === ${right}`;
  });
  if (strictCount > 0) {
    fixes.push(`Converted ${strictCount} string comparison(s) to strict equality (===)`);
  }

  // ==========================================================================
  // PASS 2: Fuzzy Matching (catches typos not covered by regex patterns)
  // ==========================================================================
  const fuzzyResult = fuzzyCorrectCode(processed);
  processed = fuzzyResult.processed;
  fixes.push(...fuzzyResult.fixes);
  
  // Fuzzy suggestions are low-confidence and returned separately
  const suggestions = fuzzyResult.suggestions;

  return { processed, fixes, suggestions };
}
