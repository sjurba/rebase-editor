var term = require( 'terminal-kit' ).terminal ;

process.stdin.resume();
process.stdin.pipe(process.stdout); 

term.fullscreen(true);

term.grabInput( { mouse: 'button' } ) ;

term.on( 'key' , function( key , matches , data ) {

    switch ( key )
    {
        case 'UP' : term.up( 1 ) ; break ;
        case 'DOWN' : term.down( 1 ) ; break ;
        case 'LEFT' : term.left( 1 ) ; break ;
        case 'RIGHT' : term.right( 1 ) ; break ;
        case 'CTRL_C' : term.fullscreen(false); process.exit() ; break ;
        default:
            // Echo anything else
            term.noFormat(
                Buffer.isBuffer( data.code ) ?
                    data.code :
                    String.fromCharCode( data.code )
            ) ;
            break ;
    }
} ) ;

term.on( 'mouse' , function( name , data ) {
    term.moveTo( data.x , data.y ) ;
} ) ;
