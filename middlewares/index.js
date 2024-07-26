const fs = require('fs');

function logReqRes(fileName){
    return (req, res, next) => {
        fs.appendFile(
            fileName,
            `\n${Date.now()}:${req.ip} ${req.method}: ${req.path}\n`,
            (err, data) => {next();}
        );
    }
}

// catch 404 and passes to error handler method
function catchErrors (){
    return (req, res, next) => {
        const err = new Error('Not Found');
        err.status = 404;
        next(err);
    }
}

// error handler
function errorHandler () {
    return (err, req, res, next) => {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') == 'development' ? err : {};
        
        // render the error page
        res.status(err.status || 500);
        res.render('error', {err});
    }
}

module.exports = {logReqRes, catchErrors, errorHandler};