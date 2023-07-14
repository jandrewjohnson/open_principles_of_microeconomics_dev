
# workflow for processing gtap results from sl4 to csv
require("stringr")
require("tidyr")
require("reshape2")

print('We are inside an r script!')

# setwd("C:/Files/Research/cge/gtap_invest/gtap_invest_dev/gtap_invest/gtap_aez/postsims")

# # list all sl4 files in input folder
# exps     <- list.files(pattern = "\\.sl4$", full.names = TRUE,  recursive = TRUE)
# expsname <- as.character(do.call("rbind", lapply((strsplit(exps, "/")), "[[", 4)))
# expsname <- gsub('(.sl4)$', '', expsname) 
# path     <- "./in/gtap"
# # path
# # getwd()


# # empty all output folders
# # unlink("./out", recursive = TRUE)
# # unlink("./temp", recursive = TRUE)

# # read mapping file folder
# subtot   <- read.csv("./in/GTAP-subtot_file.csv")
# mapping  <- read.csv("./in/GTAP-mapping_file.csv")
# regname  <- read.csv("./in/GTAP-reg_file.csv")
# mapping$header <- str_pad(mapping$header, 4, pad="0")
# # specify output type sets
# output_types <- c("PCT","LVB","LVA","LVC")

# print("create file folders based on mapping information")
# for(i in 1:nrow(mapping)){
#   for(j in output_types){
#     for(k in expsname){

#       dir.create(paste("./temp/",k,"/",as.character(mapping$variable[i]),"/",j, sep=""), recursive = TRUE)}}}

# for(k in expsname){
#   dir.create(paste("./temp/",k,"/",sep=""), recursive = TRUE)}

# dir.create(paste("./temp/merge",sep=""))
# dir.create(paste("./out",sep=""))
           


# for(k in expsname){

# #---- Absolute Changes
# sink(paste("./temp/",k,"/",k,"_LVC.inp", sep=""))
#   cat("LV   ! Select Level")
#   cat("\n")
#   cat("LVC  ! Select Level Change")
#   cat("\n")
#   cat("")
#   cat("\n")
#   cat(paste(path,"/",k,".sl4", sep=""))
#   cat("\n")
#   cat("c! Select only percent changes")
#   cat("\n")
#   cat("n  ! No header maps")
#   cat("\n")
#   cat(paste("./temp/",k,"/",k,".map", sep=""))
#   cat("\n")
#   cat(paste("./temp/",k,"/",k,"_LVC.sol", sep=""))
#   cat("\n")
# sink()

# #---- Base Level
# sink(paste("./temp/",k,"/",k,"_LVB.inp", sep=""))
#   cat("LV   ! Select Level")
#   cat("\n")
#   cat("LVB  ! Select Level Change")
#   cat("\n")
#   cat("")
#   cat("\n")
#   cat(paste(path,"/",k,".sl4", sep=""))
#   cat("\n")
#   cat("c  ! Select only percent changes")
#   cat("\n")
#   cat("n  ! No header maps")
#   cat("\n")
#   cat(paste("./temp/",k,"/",k,".map", sep=""))
#   cat("\n")
#   cat(paste("./temp/",k,"/",k,"_LVB.sol", sep=""))
#   cat("\n")
# sink()

# #---- Updated Level
# sink(paste("./temp/",k,"/",k,"_LVA.inp", sep=""))
# cat("LV   ! Select Level")
# cat("\n")
# cat("LVA  ! Select Level Change")
# cat("\n")
# cat("")
# cat("\n")
# cat(paste(path,"/",k,".sl4", sep=""))
# cat("\n")
# cat("c  ! Select only percent changes")
# cat("\n")
# cat("n  ! No header maps")
# cat("\n")
# cat(paste("./temp/",k,"/",k,".map", sep=""))
# cat("\n")
# cat(paste("./temp/",k,"/",k,"_LVA.sol", sep=""))
# cat("\n")
# sink()

#   #---- Percentage Changes
#   sink(paste("./temp/",k,"/",k,"_PCT.inp", sep=""))
# cat("")
# cat("\n")
# cat(paste(path,"/",k,".sl4", sep=""))
# cat("\n")
# cat("T  ! Select all levels percent changes")
# cat("\n")
# cat("n  ! No header maps")
# cat("\n")
# cat(paste("./temp/",k,"/",k,".map", sep=""))
# cat("\n")
# cat(paste("./temp/",k,"/",k,"_PCT.sol", sep=""))
# cat("\n")
# sink()

# }
# #     Use har2csv in supp_programs to transform csv files into har files                        
# #     Create batch file for running csv2har
# sink("call_sltoht.bat")
# for(k in expsname){
# cat(paste("call sltoht.exe -sti ","./temp/",k,"/",k,"_LVC.inp",sep=""))
# cat("\n")
# cat(paste("call sltoht.exe -sti ","./temp/",k,"/",k,"_LVB.inp",sep=""))
# cat("\n")
# cat(paste("call sltoht.exe -sti ","./temp/",k,"/",k,"_LVA.inp",sep=""))
# cat("\n")
# cat(paste("call sltoht.exe -sti ","./temp/",k,"/",k,"_PCT.inp",sep=""))
# cat("\n")
# }
# sink()

# #     Run batch file then delete file
# shell("call_sltoht.bat", wait=TRUE)  # run csv2har
# # file.remove("call_sltoht.bat")

# print("create folders based on map output")
# sink("sol2csv.bat")
# for(i in 1:nrow(mapping)){
#   for(j in output_types){
#     for(k in expsname){
# cat(paste("call har2csv.exe ","./temp/",k,"/",k,"_",j,".sol"," ./temp/",k,"/",as.character(mapping$variable[i]),"/",j,'/',as.character(mapping$variable[i]),"_",k,"_",j,'.csv ', as.character(mapping$header[i]), sep="")) 
# cat("\n")
# }}}
# sink()

# #     Run batch file then delete file
# shell("sol2csv.bat", wait=TRUE)  
# # file.remove("sol2csv.bat")

# #     List all csv files and process for base value, updated and absolute change variables

# solutions        <- c("LVA","LVB","LVC")
# solutions_name   <- c("UpdValue","BaseValue","AbsoluteChg")
# variable         <- as.character(mapping$variable)
# units            <- as.character(mapping$units)

# print("Rename")
# for(h in 1:length(solutions)){
#   for(i in 1:nrow(mapping)){
#     for(j in expsname){
#   files     <- list.files(pattern = paste(as.character(mapping$variable[i]),'_',j,'_',solutions[h],'.csv', sep=''), full.names = TRUE,  recursive = TRUE)
#   if (length(files) > 0) 
#   {
# old_data  <- read.csv(files)
# old_data          <- merge(old_data,regname, all.x=TRUE)
# old_data$TYPE     <- solutions_name[h]
# old_data$VAR      <- as.character(mapping$variable[i])
# old_data$VARNAME  <- as.character(mapping$longname[i])
# old_data$UNITS    <- as.character(mapping$units[i])
# old_data$SCENARIO <- j
# new_data <- subset(old_data, select=c("SCENARIO","VAR","VARNAME","REG","REGNAME","UNITS","TYPE","Value"))
# write.csv(new_data,  paste("./temp/merge/",as.character(mapping$variable[i]),'_',j,'_',solutions[h],"_merge",'.csv', sep=''), row.names = FALSE)}
#     }}}


# #     List all csv files and process for percent change variables with subtotals

# solutions        <- c("PCT")
# mapping2         <- mapping[mapping$variable  != "EV",]
# units            <- "%"

# print("Rename 2")
# for(h in 1:length(solutions)){
#   for(i in 1:nrow(mapping2)){
#     for(j in expsname){
#       files     <- list.files(pattern = paste(as.character(mapping2$variable[i]),'_',j,'_',solutions[h],'.csv', sep=''), full.names = TRUE,  recursive = TRUE)
#       if (length(files) > 0) 
#       {
#         old_data  <- read.csv(files)
#         old_data          <- merge(old_data,regname, all.x=TRUE)
#         old_data          <- merge(old_data,subtot, all.x=TRUE) 
#         old_data$VAR      <- as.character(mapping2$variable[i])
#         old_data$VARNAME  <- as.character(mapping2$longname[i])
#         old_data$UNITS    <- units
#         old_data$SCENARIO <- j
#         new_data <- subset(old_data, select=c("SCENARIO","VAR","VARNAME","REG","REGNAME","UNITS","TYPE","Value"))
#         write.csv(new_data,  paste("./temp/merge/",as.character(mapping2$variable[i]),'_',j,'_',solutions[h],"_merge",'.csv', sep=''), row.names = FALSE)}
#     }}}


# #     List all csv files and process for percent change variables with subtotals (for EV only)

# solutions        <- c("PCT")
# mapping3         <- mapping[mapping$variable  == "EV",]
# units            <- mapping3$units

# print("Rename 3")
# for(h in 1:length(solutions)){
#   for(i in 1:nrow(mapping3)){
#     for(j in expsname){
#       files     <- list.files(pattern = paste(as.character(mapping3$variable[i]),'_',j,'_',solutions[h],'.csv', sep=''), full.names = TRUE,  recursive = TRUE)
#       if (length(files) > 0) 
#       {
#         old_data  <- read.csv(files)
#         old_data          <- merge(old_data,regname, all.x=TRUE)
#         old_data          <- merge(old_data,subtot, all.x=TRUE) 
#         old_data$VAR      <- as.character(mapping3$variable[i])
#         old_data$VARNAME  <- as.character(mapping3$longname[i])
#         old_data$UNITS    <- units
#         old_data$SCENARIO <- j
#         new_data <- subset(old_data, select=c("SCENARIO","VAR","VARNAME","REG","REGNAME","UNITS","TYPE","Value"))
#         write.csv(new_data,  paste("./temp/merge/",as.character(mapping3$variable[i]),'_',j,'_',"LVC","_merge",'.csv', sep=''), row.names = FALSE)}
#     }}}

# print("merge1")
# mergefile <- list.files(pattern = '.merge.csv', full.names = TRUE,  recursive = TRUE)
# mergefile
# mergetemp <- read.csv(mergefile[1])

# print("merge2")
# for(i in 1:(length(mergefile)-1)){
#   mergenew  <- read.csv(mergefile[1+i])
#   mergetemp <- rbind(mergetemp, mergenew)
# }
# print("merge3")

# date <- as.character(Sys.Date())

# write.csv(mergetemp, paste("./out/",date,"_GTAP_Results.csv", sep=""), row.names = FALSE)

# # extract data

# # create folders based on map output
# sink("00_getlandcover.sti")
# cat(paste("!This STI File is written via manually"))
# cat("\n")
# cat(paste("!Run this command file using CMBHAR via DOS"))
# cat("\n")
# cat(paste("!"))
# cat("\n")
# cat(paste("BAT  ! run batch file"))
# cat("\n")
# cat(paste("-CHO ! combine similar headers"))
# cat("\n")
# cat(paste("NEP  ! specify new sets for combined data"))
# cat("\n")
# cat(paste("sims ! string data for new set"))
# cat("\n")
# cat(paste("1    ! starting value of new set - added to the string data"))
# cat("\n")
# cat(paste("1    ! increments of the starting value"))
# cat("\n")
# cat(paste(""))
# cat("\n")
# cat(paste(length(expsname),"  ! Number of files to be joined"))
# cat("\n")
# for(k in expsname){
#   cat(paste("temp/",k,"/",k,"_","LVA",".sol", sep="")) 
#   cat("\n")}
#   cat("temp\\2021_30_LANDCOVER_LVA.sol")
# sink()

# sink("run_cmbhar.bat")
# cat(paste('call c:/gp/cmbhar.exe -sti 00_getlandcover.sti'))
# sink()
# shell("run_cmbhar.bat", wait=TRUE)  

# #     Run batch file then delete file
# sink("run_har2csv.bat")
# cat(paste('call har2csv.exe temp\\2021_30_LANDCOVER_LVA.sol',' temp\\2021_30_LANDCOVER_LVA.csv ', sep=""), '"0257"')
# sink()
# shell("run_har2csv.bat", wait=TRUE)  

# # file.remove("run_cmbhar.bat")
# # file.remove("run_har2csv.bat")
# # file.remove("00_getlandcover.sti")

# AEZ_cover <- read.csv('temp\\2021_30_LANDCOVER_LVA.csv')

# AEZ_scen_map <- cbind(paste("sims",seq(1, length(expsname), 1), sep=""), expsname)
# colnames(AEZ_scen_map) <- c("COMBINED", "SCENARIO")

# AEZ_cover_map <- cbind(c("forestsec","UNMNGLAND","CROPLAND","ruminant"),c("Managed Forest Cover","Other Land","Cropland Cover","Pasture Cover")) 
# colnames(AEZ_cover_map) <- c("LAND_COVER", "VARNAME")

# AEZ_cover <- merge(AEZ_cover,AEZ_scen_map)
# AEZ_cover <- merge(AEZ_cover,AEZ_cover_map)

# AEZ_cover$UNITS <-"hectares"
# AEZ_cover$TYPE <-"UpdValue"

# AEZ_cover_fin <- subset(AEZ_cover, select=c(SCENARIO, VARNAME, REG, AEZ_COMM, UNITS, TYPE, Value))

# write.csv(AEZ_cover_fin, paste("out/",date,"_GTAP_AEZ_LCOVER_ha.csv", sep=""), row.names = FALSE)

# # unlink("./temp", recursive = TRUE)



