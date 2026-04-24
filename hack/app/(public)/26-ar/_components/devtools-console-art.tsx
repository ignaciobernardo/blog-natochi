'use client';

import { useEffect } from 'react';

const DEVTOOLS_THRESHOLD_PX = 120;
const HIDDEN_LINK_MESSAGE =
  'che, whats up hacker. you found the hidden apply link. here you go: https://hack.platan.us/26-ar/apply/hidden';
const DEVTOOLS_CONSOLE_ART = `                                            ##==-
                                           #*:-: 
                                        *##+:-:  
                                        **+:--++ 
                                        ++:=***+ 
                                       --:---    
                                      ==::::     
                                     -=::::.     
               ++=-  .   .:-==++    *+=-::       
            +=-.-==:-==-.-====-=### *+=-::       
         ++=-:--::=++***%#%%#***%%##*+-::        
        *+=-==-=**===++===+#**#%@%###--:         
       *+==-=-====::-++==:-+=+%@@%#%+--+         
      #*=+-=-=---=++-+====++=**@%%%#--+*         
      #*=+-=-=**==+==+++++++**@@%%%-=*=*+        
     .**=*=--+++-==-++=+##%#*#@@@@@**++*..       
    -:-*+*+==+*++-.-+===-**+*#%%@@##+=*+.--      
   -=::+#++*=+*+*+.+++****++*%@%@@@*-++..=+-     
  -++=::=#*=*+=+**++=***+***#%##*+--+*:..**+-    
 -=*##:...+*+==+*+==+**+#****++-.:-+=:::+##*=-   
 -+*#%%:....-*+=---==++===-:.. :+*=---:+%###*=-  
==*#%%%%=.....:+##+==-:....-++=:.:--::#%%%##*+-  
=+*#%%%%%%+...:=+******+++=-:..::::-#%%%%%%##*=. 
=+*#%%@@%@@@%=..-+*****+++==:..::*%%@%%%%%%%#*=: 
=**#%%@@@@@@@@@@@@*=-------=#%%%%%@@@@%%%%%##*+- 
=+*#%%%@@@@@@@@@@@@@@@@%%@@@%@@@@@@%@@%%%%%##*+= 
=+*##%%%@@@@@@@@@@@@@@@@@%@@@%@@@@@@@%%%%%%##*+- 
==**#%%%%@@@@@@@@@@@@@@@@@@@@%@@@@%%%%%%%%%##*=  
 =+*##%%%%%@@@@@@@@@@%%@@@%%%%%%@@@@@%%%%%##*+=  
  =+*##%%%%%@@@@@@@@@@@@@@%@%%%%%%%%%%%%%##*+=   
  +=+*##%%%%@@@@@@@@%%%@@@%%%%%%%%%%%%%###*+=-   
    -=**##%%%%@@@@@@@%%%@%%%%%%%%%%%%%###*+=     
     ==+*###%%%%%%%%%%%%%%@%%%%%%%%%%##**+-      
       ==+**##%%%%%%%%%%%%%%%%%%######*+-        
         ==+**######%%%%%%#%#######*+==          
            =++**********######**+==             
              +++++++**++++++===`;

function isDevToolsOpen() {
  return (
    window.outerWidth - window.innerWidth > DEVTOOLS_THRESHOLD_PX ||
    window.outerHeight - window.innerHeight > DEVTOOLS_THRESHOLD_PX
  );
}

export default function DevtoolsConsoleArt() {
  useEffect(() => {
    const globalWindow = window as Window & {
      __hack26DevtoolsConsoleBootLogged?: boolean;
      __hack26DevtoolsConsoleWasOpen?: boolean;
    };
    const printConsoleArt = () => {
      console.log(DEVTOOLS_CONSOLE_ART);
      console.log(HIDDEN_LINK_MESSAGE);
    };

    // Always log once per page load so it appears when Console opens,
    // even if size-based DevTools detection misses the user's setup.
    if (!globalWindow.__hack26DevtoolsConsoleBootLogged) {
      printConsoleArt();
      globalWindow.__hack26DevtoolsConsoleBootLogged = true;
    }

    const evaluateConsoleState = () => {
      const isOpen = isDevToolsOpen();
      const wasOpen = globalWindow.__hack26DevtoolsConsoleWasOpen ?? false;

      if (isOpen && !wasOpen) {
        printConsoleArt();
      }

      globalWindow.__hack26DevtoolsConsoleWasOpen = isOpen;
    };

    evaluateConsoleState();
    window.addEventListener('resize', evaluateConsoleState);
    window.addEventListener('focus', evaluateConsoleState);
    const interval = window.setInterval(evaluateConsoleState, 1000);

    return () => {
      window.removeEventListener('resize', evaluateConsoleState);
      window.removeEventListener('focus', evaluateConsoleState);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
